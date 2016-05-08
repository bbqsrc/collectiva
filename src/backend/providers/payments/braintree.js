"use strict"

const { Promise } = require("bluebird")
const braintree = require("braintree")
const promised = require('braintree-as-promised')

const logger = require("../../lib/logger")
const { Payments } = require("./index")
const { Invoice } = require("../../models")

const config = require("../../../../config")

class BraintreePayments extends Payments {
  constructor(router) {
    super(router)

    this.name = "braintree"
    this.gateway = promised(braintree.connect(config.gateways.braintree))
  }

  * generateToken(ctx) {
    // Get session
    // TODO: there is no ctx.session. so: enable sessions?
    if (ctx.session && ctx.session.braintreeToken) {
      ctx.body = { token: ctx.session.braintreeToken }
      return
    }

    const res = yield this.gateway.clientToken.generate({})

    // see above
    // ctx.session.braintreeToken = res.clientToken
    ctx.body = { token: res.clientToken }
  }

  * processPayment(ctx) {
    // TODO: Nicer input validation
    const nonce = ctx.request.fields.paymentInfo.nonce
    const amount = ctx.request.fields.amount
    const memberId = ctx.request.fields.memberId

    try {
      // TODO: investigate metadata field for processing
      const res = yield this.gateway.transaction.sale({
        amount,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true
        }
      })

      const data = {
        amount,
        memberId,
        status: res.success ? "payed" : null
      }
      const invoice = yield Invoice.createFromFormData(this.name, data)

      // TODO: email invoice

      ctx.status = 200
      ctx.body = {
        transactionId: invoice.transactionId
      }
    } catch (error) {
      logger.crit("payments:braintree", "An unexpected error occurred processing a payment", { request: ctx.request, error })
      ctx.status = 502
      ctx.body = { error: "An unexpected error occurred processing a payment." }
    }
  }
}

module.exports = { BraintreePayments }
