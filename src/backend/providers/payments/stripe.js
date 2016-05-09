"use strict"

const stripe = require("stripe")

const logger = require("../../lib/logger")
const { Payments } = require("./index")
const { Invoice } = require("../../models")

const config = require("../../../../config")

class StripePayments extends Payments {
  constructor(router) {
    super(router)

    this.name = "stripe"
    this.gateway = stripe(config.gateways.stripe.privateKey)
  }

  * generateToken(ctx) {
    ctx.body = { token: config.gateways.stripe.clientToken }
  }

  * processPayment(ctx) {
    const { paymentInfo, amount, description, memberId } = ctx.request.fields

    try {
      // TODO: add metadata field like:
      // metadata: {'order_id': '6735'}
      const res = yield this.gateway.charges.create({
        source: paymentInfo.id,
        amount: Math.floor(parseFloat(amount) * 100),
        description,
        currency: config.gateways.stripe.currency
      })

      const data = {
        amount,
        memberId,
        status: res.paid ? "paid" : null
      }
      const invoice = yield Invoice.createFromFormData(this.name, data)

      // TODO: email invoice

      ctx.status = 200
      ctx.body = {
        transactionId: invoice.transactionId
      }
    } catch (error) {
      if (error.type === "StripeCardError") {
        logger.warn("payments:stripe", "A card has been declined", { request: ctx.request, error })
        ctx.status = 400
        ctx.body = { error: "The card has been declined by the payment gateway." }
        // The card has been declined
      } else {
        logger.crit("payments:stripe", "An unexpected error occurred processing a payment", { request: ctx.request, error })
        ctx.status = 502
        ctx.body = { error: "An unexpected error occurred processing a payment." }
      }
    }
  }
}

module.exports = { StripePayments }
