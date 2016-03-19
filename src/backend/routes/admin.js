"use strict"

const { endpoints } = require("koa-rutt")
const { requireAuth } = require("../providers/auth")

class AdminRoutes {
  [endpoints]() {
    return {
      get: {
        "/admin/*": [requireAuth, this.renderAdmin]
      }
    }
  }

  * renderAdmin(ctx) {

  }
}

module.exports = { AdminRoutes }
