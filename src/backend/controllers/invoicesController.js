"use strict"

const invoiceService = require("../services/invoiceService"),
      paymentValidator = require("../../lib/paymentValidator"),
      ChargeCardError = require("../errors/ChargeCardError"),
      logger = require("../lib/logger"),
      Q = require("q")

function sendResponseToUser(res) {
  return () => {
    res.status(200).json({})
  }
}

function handleError(res) {
  return (error) => {
    if (error instanceof ChargeCardError) {
      res.status(400).json({ errors: error.message })
    } else {
      res.status(500).json({ errors: "An error has occurred internally." })
    }
  }
}

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

  if (validationErrors.length > 0) {
    res.status(400).json({ errors: validationErrors })
    return Q.reject({ errors: validationErrors })
  }

  return invoiceService.payForInvoice(newInvoice)
        .then(sendResponseToUser(res))
        .catch(handleError(res))
}

function acceptPayment(req, res) {
  const reference = req.params.reference

  return invoiceService.acceptPayment(reference)
    .tap(() => {
      logger.info("invoice:payment-accepted",
        `Payment with reference '${reference}' processed`,
        { req }
      )
    })
    .then(sendResponseToUser(res))
    .catch((error) => {
      logger.error("invoice:payment-failed",
        `Payment with reference '${reference}' failed`,
        { req, error }
      )
      res.status(500).json({ errors: "Payment could not be accepted" })
      return Q.reject("Payment could not be accepted")
    })
}

module.exports = {
  updateInvoiceHandler,
  acceptPayment
}
