"use strict"

const memberService = require("../services/memberService"),
      invoiceService = require("../services/invoiceService"),
      memberValidator = require("../../lib/memberValidator"),
      messagingService = require("../services/messagingService"),
      stripeHandler = require("../lib/stripeHandler"),
      paypalHandler = require("../lib/paypalHandler"),
      logger = require("../lib/logger"),
      Promise = require("bluebird").Promise,
      co = require("co")

function filterAddress(obj) {
  const { address, suburb, postcode, state, country } = obj

  return { address, suburb, postcode, state, country }
}

function residentialAddress(req) {
  return filterAddress(req.body.residentialAddress)
}

function isPostalAddressEmpty(postal) {
  return postal.address === "" &&
    postal.suburb === "" &&
    postal.postcode === ""
}

function postalAddress(req) {
  if (isPostalAddressEmpty(req)) {
    return residentialAddress(req)
  }

  return filterAddress(req.body.postalAddress)
}

function setupNewMember(req) {
  const {
    firstName, lastName, email, gender, primaryPhoneNumber,
    secondaryPhoneNumber, dateOfBirth, membershipType
  } = req.body

  return {
    firstName, lastName, email, gender, primaryPhoneNumber,
    secondaryPhoneNumber, dateOfBirth, membershipType,
    residentialAddress: residentialAddress(req),
    postalAddress: postalAddress(req)
  }
}

function newMemberHandler(req, res) {
  const newMember = setupNewMember(req)
  const validationErrors = memberValidator.isValid(newMember)

  return co(function* () {
    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors })
      return
    }

    let member

    try {
      member = yield memberService.createMember(newMember)
    } catch (error) {
      logger.crit("create-member",
        "An error occurred while creating member",
        { req, error }
      )
      return
    }

    const invoice = yield invoiceService.createEmptyInvoice(member.email, member.membershipType)

    res.status(200).json({
      invoiceId: invoice.id,
      newMember: {
        email: member.email
      }
    })

    try {
      messagingService.sendVerificationEmail(member)
    } catch (error) {
      logger.error("verify-member:send-email",
        `An error occurred sending verification email for member ${member.id}`,
        { memberId: member.id, req, error }
      )
      return
    }
  })
}

function updateMemberHandler(req, res) {
  const newMember = setupNewMember(req)
  const validationErrors = memberValidator.isValid(newMember)

  return co(function* () {
    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors })
      return
    }

    try {
      const member = yield memberService.updateMember(newMember)

      res.status(200).json({ newMember: member })
    } catch (error) {
      logger.crit("update-member",
        "An error occurred while updating member",
        { req, error }
      )
    }
  })
}

function verify(req, res) {
  const hash = req.params.hash

  if (!memberValidator.isValidVerificationHash(hash)) {
    logger.warning("verify-member", "Received invalid hash", { req, hash })
    res.sendStatus(400)
    return Promise.reject(new Error("Invalid Input"))
  }

  return co(function* () {
    try {
      yield memberService.verify(hash)
      res.redirect("/verified")
    } catch (error) {
      res.sendStatus(400)
    }
  })
}

function renew(req, res) {
  const hash = req.params.hash

  if (!memberValidator.isValidVerificationHash(hash)) {
    logger.warning("renew-member", "Received invalid hash", { req, hash })
    res.sendStatus(400)
    return Promise.reject(new Error("Invalid Input"))
  }

  return co(function* () {
    const member = yield memberService.findMemberByRenewalHash(hash)
    const headers = Object.assign({ user: JSON.stringify(member) },
      stripeHandler.getStripeHeaders(),
      paypalHandler.getPaypalHeaders()
    )

    res.header(headers).render("renew")
  })
}

function renewMemberHandler(req, res) {
  const hash = req.body.renewalHash

  return co(function* () {
    const member = yield memberService.renewMember(hash)
    const invoice = yield invoiceService.createEmptyInvoice(member.email, member.membershipType)

    res.status(200).json({
      invoiceId: invoice.id,
      newMember: {
        email: member.email
      }
    })
  })
}

module.exports = {
  newMemberHandler,
  updateMemberHandler,
  verify,
  renew,
  renewMemberHandler
}
