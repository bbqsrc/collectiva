"use strict"

const { DirectDepositPayments } = require("./direct-deposit")

class ChequePayments extends DirectDepositPayments {
  constructor(router) {
    super(router)

    this.name = "cheque"
  }
}

module.exports = { ChequePayments }
