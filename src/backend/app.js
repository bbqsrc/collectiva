"use strict"

const { Promise } = require("bluebird")
const fs = Promise.promisifyAll(require("fs"))
const path = require("path")

const env = process.env.NODE_ENV || "development" // eslint-disable-line
// const config = require("proxenv")(path.join(__dirname, "config"))
const logger = require("./lib/logger")
const koa = require("koa")
const passport = require("koa-passport")
const Iso = require("iso")

const app = koa()
// const membershipRenewalService = require("./services/membershipRenewalService")

app.use(function* errorCatcher(next) {
  try {
    yield next
  } catch (error) {
    const msg = "Internal server error. Please contact an administrator."

    this.status = error.status || 500
    if (env === "development") {
      this.body = `<pre>${error.stack}</pre>`
    } else {
      this.body = msg
    }

    this.app.emit("error", error, this)
    logger.error("app", "Internal server error", { request: this.request, error })
  }
})

// Add iso, fuck yeah
const isoPath = "../views"

app.use(function* isoMiddleware(next) {
  this.isoRender = function* isoRender(name, data) {
    // TODO caching
    const tmpl = yield fs.readFileAsync(path.join(isoPath, name), { encoding: "utf8" })
    const iso = new Iso()

    iso.add(tmpl, data)
    this.body = iso.render()
  }.bind(this)

  yield next
})

// body parser. Stupid that it's not there by default.
app.use(require("koa-better-body")())

// Save us from malwankers
app.use(require("koa-helmet")())

// Simple sessions, extend to redis later.
app.keys = ["TODO: don't hardcode this"]
app.use(require("koa-session")(app))

// Passport, it's like useful or some shit?
app.use(passport.initialize())
app.use(passport.session())

app.use(require("./routes").middleware())
// Renewal reminders, we love money.
// membershipRenewalService.start()

module.exports = app
