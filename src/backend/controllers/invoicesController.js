"use strict"

const invoiceService = require("../services/invoiceService"),
      paymentValidator = require("../../lib/paymentValidator"),
      ChargeCardError = require("../errors/ChargeCardError"),
      logger = require("../lib/logger")

function* updateInvoiceHandler(next) {
  const newInvoice = {
    totalAmount: this.request.body.fields.paymentType === "noContribute" ? 0 : this.request.body.fields.totalAmount,
    paymentType: this.request.body.fields.paymentType,
    stripeToken: this.request.body.fields.stripeToken,
    invoiceId: this.request.body.fields.invoiceId
  }

  let validationErrors

  if (this.request.body.fields.paymentType === "noContribute") {
    validationErrors = paymentValidator.isValidNoContribute(newInvoice)
  } else {
    validationErrors = paymentValidator.isValid(newInvoice)
  }

  if (validationErrors.length > 0) {
    this.status = 400
    this.body = { errors: validationErrors }
    return
  }

  try {
    yield invoiceService.payForInvoice(newInvoice)
    this.body = {}
  } catch (error) {
    if (error instanceof ChargeCardError) {
      this.status = 400
      this.body = { errors: error.message }
    } else {
      this.status = 500
      this.body = { errors: "An error has occurred internally." }
    }
  }
}

function* acceptPayment(next) {
  const reference = this.params.reference

  try {
    yield invoiceService.acceptPayment(reference)

    logger.info("invoice:payment-accepted",
      `Payment with reference '${reference}' processed`,
      { request: this.request }
    )

    this.body = {}
  } catch (error) {
    logger.error("invoice:payment-failed",
      `Payment with reference '${reference}' failed`,
      { request: this.request, error }
    )

    this.status = 500
    this.body = { errors: "Payment could not be accepted" }
  }
}

module.exports = {
  updateInvoiceHandler,
  acceptPayment
}
