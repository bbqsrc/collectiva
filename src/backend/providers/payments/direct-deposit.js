"use strict"

const logger = require("../../lib/logger")
const { Payments } = require("./index")
const { Invoice } = require("../../models")

class DirectDepositPayments extends Payments {
  constructor(router) {
    super(router)

    this.name = "direct-deposit"
  }

  * generateToken(ctx) {
    ctx.status = 501
  }

  * processPayment(ctx) {
    const data = ctx.request.fields
    const invoice = yield Invoice.createFromFormData(this.name, data)

    // TODO: email invoice

    ctx.status = 200
    ctx.body = {
      transactionId: invoice.transactionId
    }
  }
}

module.exports = { DirectDepositPayments }
