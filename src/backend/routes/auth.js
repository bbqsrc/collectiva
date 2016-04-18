"use strict"

const { endpoints } = require("koa-rutt")
const passport = require("koa-passport")

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
    ctx.body = yield ctx.render("login")
  }

  * login(ctx, next) {
    passport.authenticate("local", {
      successRedirect: "/admin"
    })
  }

  * logout(ctx) {
    ctx.logout()
    ctx.redirect("/login")
  }
}

module.exports = { AuthenticationRoutes }
