"use strict"

const Router = require("koa-rutt"),
      passport = require("passport"),
      membersController = require("../controllers/membersController"),
      adminController = require("../controllers/adminController"),
      invoicesController = require("../controllers/invoicesController"),
      stripeHandler = require("../lib/stripeHandler"),
      paypalHandler = require("../lib/paypalHandler"),
      logger = require("../lib/logger")

const router = new Router()

function* requireAuth(next) {
  if (!this.req.isAuthenticated()) {
    logger.warning("routing",
      `Attempted unauthorised access to: ${this.url}`,
      { request: this.request }
    )
    req.session.messages = "You need to login to view this page"
    this.redirect("/login")
    return
  }

  yield next
}

router.get("/", (req, res) => {
  const headers = Object.assign({}, stripeHandler.getStripeHeaders(), paypalHandler.getPaypalHeaders())

  res.header(headers).render("index", { title: "Pirate Party Membership" })
})

router.get("/members/new", (req, res) => {
  res.render("members/new", { title: "New Member" })
})

router.route("/members")
  .post(membersController.newMemberHandler)
  .get(requireAuth, adminController.membersList)

router.post("/members/update", membersController.updateMemberHandler)

router.get("/members/verify/:hash", membersController.verify)
router.get("/members/renew/:hash", membersController.renew)

router.get("/verified", (req, res) => {
  res.render("account-verified", { title: "Pirate Party Membership" })
})

router.post("/renew", membersController.renewMemberHandler)

router.post("/payments/paypal", paypalHandler.handleIpn)
router.post("/invoices/update", invoicesController.updateInvoiceHandler)
router.post("/invoices/unaccepted/:reference", requireAuth, invoicesController.acceptPayment)
router.get("/invoices/unaccepted", requireAuth, adminController.unconfirmedPaymentsMembersList)

router.post("/login", passport.authenticate("local"), (req, res) => {
  req.session.save(() => {
    res.redirect("/admin")
  })
})

router.get("/login", (req, res) => {
  res.render("login", { title: "Login" })
})

router.get("/logout", requireAuth, (req, res) => {
  req.logout()
  res.redirect("/login")
})

router.get("/admin", requireAuth, (req, res) => {
  res.render("admin", { title: "Pirate Party Admin" })
})

module.exports = router
