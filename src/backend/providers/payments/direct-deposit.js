"use strict"

const logger = require("./logger")
const { Payments } = require("./payments")

class DirectDepositPayments extends Payments {
  constructor(router) {
    super(router)

    this.name = "direct-deposit"
  }

  * generateToken(ctx) {
    ctx.status = 501
  }

  * processPayment(ctx) {
    // TODO: generate unique reference

    // TODO: generate invoice

    // TODO: email invoice
  }
}

module.exports = { DirectDepositPayments }
