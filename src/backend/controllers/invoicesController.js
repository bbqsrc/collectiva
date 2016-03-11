"use strict"

const invoiceService = require("../services/invoiceService"),
      paymentValidator = require("../../lib/paymentValidator"),
      ChargeCardError = require("../errors/ChargeCardError"),
      logger = require("../lib/logger"),
      co = require("co")

function updateInvoiceHandler(req, res) {
  const newInvoice = {
    totalAmount: req.body.paymentType === "noContribute" ? 0 : req.body.totalAmount,
    paymentType: req.body.paymentType,
    stripeToken: req.body.stripeToken,
    invoiceId: req.body.invoiceId
  }

  let validationErrors

  if (req.body.paymentType === "noContribute") {
    validationErrors = paymentValidator.isValidNoContribute(newInvoice)
  } else {
    validationErrors = paymentValidator.isValid(newInvoice)
  }

  return co(function* () {
    if (validationErrors.length > 0) {
      res.status(400).json({ errors: validationErrors })
      return { errors: validationErrors }
    }

    try {
      yield invoiceService.payForInvoice(newInvoice)
      res.status(200).json({})
    } catch (error) {
      if (error instanceof ChargeCardError) {
        res.status(400).json({ errors: error.message })
      } else {
        res.status(500).json({ errors: "An error has occurred internally." })
      }
    }
  })
}

function acceptPayment(req, res) {
  const reference = req.params.reference

  return co(function* () {
    try {
      yield invoiceService.acceptPayment(reference)

      logger.info("invoice:payment-accepted",
        `Payment with reference '${reference}' processed`,
        { req }
      )

      res.status(200).json({})
    } catch (error) {
      logger.error("invoice:payment-failed",
        `Payment with reference '${reference}' failed`,
        { req, error }
      )

      res.status(500).json({ errors: "Payment could not be accepted" })
    }
  })
}

module.exports = {
  updateInvoiceHandler,
  acceptPayment
}
