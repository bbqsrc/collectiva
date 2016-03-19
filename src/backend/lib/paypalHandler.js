"use strict" /* eslint-disable camelcase */

const invoiceService = require("../services/invoiceService"),
      Promise = require("bluebird").Promise,
      paypalIpn = Promise.promisifyAll(require("paypal-ipn")),
      logger = require("./logger")

const env = process.env.NODE_ENV || "development"

let config = {}

try {
  config = require("../../../config/paypal-config.json")[env]
} catch (e) {
  logger.alert("Could not find paypal config file")
}

function getPaypalHeaders() {
  return {
    "Paypal-Server-Url": config.paypal_server_url,
    "Paypal-Return-Url": config.paypal_return_url,
    "Paypal-Email": config.paypal_email
  }
}

function* handleIpn(next) {
  if (!config.paypal_server_url) {
    this.status = 400
    return
  }

  const isSandbox = config.paypal_server_url.indexOf(".sandbox.") !== -1

  try {
    yield paypalIpn.verifyAsync(this.request.body.fields, { allow_sandbox: isSandbox })
    const { payment_status, receiver_email, custom, txn_id } = this.request.body.fields

    if (payment_status === "Completed" && receiver_email === config.paypal_email) {
      yield invoiceService.paypalChargeSuccess(custom, txn_id)
      this.body = ""
      return
    }
  } catch (error) {
    logger.crit("payment-processor:paypal", "Failed to verify IPN request", { request: this.request, error })
    this.status = 400
    return
  }
}

module.exports = {
  handleIpn,
  getPaypalHeaders
}
