"use strict"

const stripe = require("stripe")

const logger = require("./logger")
const { Payments } = require("./payments")

class StripePayments extends Payments {
  constructor(router) {
    super(router)

    this.name = "stripe"
    this.gateway = stripe(config.gateways.stripe.secretKey)
  }

  * generateToken(ctx) {
    ctx.body = { token: config.gateways.stripe.clientToken }
  }

  * processPayment(ctx) {
    const { stripeToken, amount, description } = ctx.request.body.fields

    try {
      // TODO: add metadata field like:
      // metadata: {'order_id': '6735'}
      const res = yield stripe.charges.create({
        amount,
        description,
        currency: config.gateways.stripe.currency
      })

      // TODO: save result of transaction
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
