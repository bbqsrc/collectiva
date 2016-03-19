"use strict"

const logger = require("../lib/logger")

function* requireAuth(ctx, next) {
  // TODO: handle auth properly
  if (!ctx.req.isAuthenticated()) {
    logger.warning("routing",
      `Attempted unauthorised access to: ${ctx.url}`,
      { request: ctx.request }
    )

    ctx.session.messages = "You need to login to view this page"
    ctx.redirect("/login")
    return
  }

  yield next
}

module.exports = { requireAuth }
