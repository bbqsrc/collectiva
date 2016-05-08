"use strict"

const Router = require("koa-rutt")

const { MemberRoutes } = require("./member")
const { AdminRoutes } = require("./admin")
const { AuthenticationRoutes } = require("./auth")

const { BraintreePayments } = require("../providers/payments/braintree")
const { DirectDepositPayments } = require("../providers/payments/direct-deposit")
const { ChequePayments } = require("../providers/payments/cheque")
const { StripePayments } = require("../providers/payments/stripe")

const router = new Router()

// Payment gateways
router
.use(BraintreePayments)
.use(DirectDepositPayments)
.use(ChequePayments)
.use(StripePayments)

// Complex routes
.use(MemberRoutes)
.use(AdminRoutes)
.use(AuthenticationRoutes)

// Redirects
router
.get("/", function* (ctx) {
  ctx.redirect("/members/new")
})

module.exports = router
