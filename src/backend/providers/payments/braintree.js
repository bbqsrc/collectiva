"use strict"

const { Promise } = require("bluebird")
const braintree = Promise.promisifyAll(require("braintree"))

const logger = require("./logger")
const { Payments } = require("./payments")

class BraintreePayments extends Payments {
  constructor(router) {
    super(router)

    this.name = "braintree"
    this.gateway = braintree.connect(config.gateways.braintree)
  }

  * generateToken(ctx) {
    // Get session
    if (ctx.session.braintreeToken) {
      ctx.body = { token: ctx.session.braintreeToken }
      return
    }

    const res = yield this.gateway.clientToken.generateAsync({})

    ctx.session.braintreeToken = res.clientToken
    ctx.body = res.clientToken
  }

  * processPayment(ctx) {
    const nonce = ctx.request.body.fields.payment_method_nonce
    const amount = ctx.request.body.fields.amount

    try {
      // TODO: investigate metadata field for processing
      const res = yield this.gateway.transaction.saleAsync({
        amount,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true
        }
      })

      // TODO: save result of transaction
    } catch (error) {
      logger.crit("payments:braintree", "An unexpected error occurred processing a payment", { request: ctx.request, error })
      ctx.status = 502
      ctx.body = { error: "An unexpected error occurred processing a payment." }
    }
  }
}

module.exports = { BraintreePayments }
