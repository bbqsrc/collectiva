"use strict"

const { endpoints } = require("koa-rutt")
const { Member } = require("../models")

function json(fn) {
  return function* checkHeaders(ctx, next) {
    if (!ctx.is("json")) {
      ctx.throw(400, "Request body must be of type application/json")
    }

    if (!ctx.accepts("json")) {
      ctx.throw(406, "Server responds only with application/json")
    }

    yield* fn(ctx, next)
  }
}

class MemberRoutes {
  [endpoints]() {
    return {
      get: {
        "/members/new": this.renderNew,
        "/members/renew/:id/:hash": this.renderRenew,
        "/members/update/:id/:hash": this.renderUpdate,
        "/members/verify/:id/:hash": this.renderVerify
      },
      post: {
        "/members/new": json(this.new.bind(this)),
        "/members/renew/:id/:hash": json(this.renew.bind(this)),
        "/members/update/:id/:hash": json(this.update.bind(this))
      }
    }
  }

  * renderNew(ctx) {
    // ctx.body = yield ctx.isoRender("member-form", { mode: "new" })
    yield ctx.render("index", { title: "Join" })
  }

  * renderRenew(ctx) {
    // ctx.body = yield ctx.isoRender("member-form", { mode: "renew" })
  }

  * renderUpdate(ctx) {
    // ctx.body = yield ctx.isoRender("member-form", { mode: "update" })
  }

  * renderVerify(ctx) {
    // ctx.body = yield ctx.isoRender("member-verify")
  }

  * new(ctx) {
    // Validate the input

    // Create member
    const member = yield new Member(data)

    yield member.sendVerificationEmail()

    ctx.status = 200
  }

  * renew(ctx) {
    // Validate the input

    // Do renew-specific stuff

    // Update details
    yield* this.update(ctx)
  }

  * update(ctx) {
    // Validate the input

    // Find member
    const member = yield Member.findById(id)
    const oldEmail = member.email

    // Manage the update, including sending verification email if email changed
    member.updateDetails(data)

    ctx.status = 200
  }
}

module.exports = { MemberRoutes }
