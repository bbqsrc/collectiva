"use strict"

const { endpoints } = require("koa-rutt")

class AuthenticationRoutes {
  [endpoints]() {
    return {
      get: {
        "/login": this.renderLogin,
        "/logout": this.logout
      },
      post: {
        "/login": this.login
      }
    }
  }

  * renderLogin(ctx) {

  }

  * login(ctx) {

  }

  * logout(ctx) {

  }
}

module.exports = { AuthenticationRoutes }
