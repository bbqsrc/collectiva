"use strict" /* eslint-disable camelcase */

const Promise = require("bluebird").Promise,
      Stripe = require("stripe").Stripe,
      logger = require("./logger")

const env = process.env.NODE_ENV || "development"

let config = {}

try {
  config = require("../../../config/stripe-config.json")[env]
} catch (e) {
  logger.alert("Could not find stripe config file")
}

const stripe = new Stripe(config.stripe_secret_key)

function getStripeHeaders() {
  return {
    "Stripe-Public-Key": config.stripe_public_key
  }
}

function chargeCard(stripeToken, totalAmount) {
  return stripe.charges.create({
    // TODO: wtf?
    amount: parseFloat(totalAmount) * 100,
    currency: "aud",
    source: stripeToken.id,
    // TODO: wtf?
    description: "Pirate party membership."
  })
}

module.exports = {
  chargeCard,
  getStripeHeaders
}
