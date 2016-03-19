"use strict"

const Router = require("koa-rutt")

const { BraintreePayments } = require("../providers/payments/braintree")
const { StripePayments } = require("../providers/payments/stripe")

const { MemberRoutes } = require("./member")
const { AdminRoutes } = require("./admin")
const { AuthenticationRoutes } = require("./auth")

const router = new Router()

// Payment gateways
router
.use(BraintreePayments)
.use(StripePayments)

// Complex routes
router
.use(MemberRoutes)
.use(AdminRoutes)
.use(AuthenticationRoutes)

module.exports = router
