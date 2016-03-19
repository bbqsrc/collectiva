"use strict"

const memberService = require("../services/memberService"),
      invoiceService = require("../services/invoiceService"),
      memberValidator = require("../../lib/memberValidator"),
      messagingService = require("../services/messagingService"),
      stripeHandler = require("../lib/stripeHandler"),
      paypalHandler = require("../lib/paypalHandler"),
      logger = require("../lib/logger")

function filterAddress(obj) {
  const { address, suburb, postcode, state, country } = obj

  return { address, suburb, postcode, state, country }
}

function residentialAddress(req) {
  return filterAddress(req.body.fields.residentialAddress)
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

  return filterAddress(req.body.fields.postalAddress)
}

function setupNewMember(req) {
  const {
    firstName, lastName, email, gender, primaryPhoneNumber,
    secondaryPhoneNumber, dateOfBirth, membershipType
  } = this.request.body.fields

  return {
    firstName, lastName, email, gender, primaryPhoneNumber,
    secondaryPhoneNumber, dateOfBirth, membershipType,
    residentialAddress: residentialAddress(req),
    postalAddress: postalAddress(req)
  }
}

function* newMemberHandler(next) {
  const newMember = setupNewMember(this.request)
  const validationErrors = memberValidator.isValid(newMember)

  if (validationErrors.length > 0) {
    this.status = 400
    this.body = { errors: validationErrors }
    return
  }

  let member

  try {
    member = yield memberService.createMember(newMember)
  } catch (error) {
    logger.crit("create-member",
      "An error occurred while creating member",
      { request: this.request, error }
    )
    return
  }

  const invoice = yield invoiceService.createEmptyInvoice(member.email, member.membershipType)

  this.body = {
    invoiceId: invoice.id,
    newMember: {
      email: member.email
    }
  }

  try {
    messagingService.sendVerificationEmail(member)
  } catch (error) {
    logger.error("verify-member:send-email",
      `An error occurred sending verification email for member ${member.id}`,
      { memberId: member.id, request: this.request, error }
    )
    return
  }
}

function* updateMemberHandler(next) {
  const newMember = setupNewMember(this.request)
  const validationErrors = memberValidator.isValid(newMember)

  if (validationErrors.length > 0) {
    this.status = 400
    this.body = { errors: validationErrors }
    return
  }

  try {
    const member = yield memberService.updateMember(newMember)

    this.body = { newMember: member }
  } catch (error) {
    logger.crit("update-member",
      "An error occurred while updating member",
      { request: this.request, error }
    )
  }
}

function* verify(next) {
  const hash = this.params.hash

  if (!memberValidator.isValidVerificationHash(hash)) {
    logger.warning("verify-member", "Received invalid hash", { request: this.request, hash })
    this.status = 400
    return
  }

  try {
    yield memberService.verify(hash)
    this.redirect("/verified")
  } catch (error) {
    this.status = 400
    return
  }
}

function* renew(next) {
  const hash = this.params.hash

  if (!memberValidator.isValidVerificationHash(hash)) {
    logger.warning("renew-member", "Received invalid hash", { request: this.request, hash })
    this.status = 400
    return
  }

  const member = yield memberService.findMemberByRenewalHash(hash)
  const headers = Object.assign(
    { user: JSON.stringify(member) },
    stripeHandler.getStripeHeaders(),
    paypalHandler.getPaypalHeaders()
  )

  this.set(headers)
  this.body = yield this.render("renew")
}

function* renewMemberHandler(next) {
  const hash = this.request.body.fields.renewalHash

  const member = yield memberService.renewMember(hash)
  const invoice = yield invoiceService.createEmptyInvoice(member.email, member.membershipType)

  this.body = {
    invoiceId: invoice.id,
    newMember: {
      email: member.email
    }
  }
}

module.exports = {
  newMemberHandler,
  updateMemberHandler,
  verify,
  renew,
  renewMemberHandler
}
