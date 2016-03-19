"use strict"

const { endpoints } = require("koa-rutt")

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
        "/members/new": this.new,
        "/members/renew/:id/:hash": this.renew,
        "/members/update/:id/:hash": this.update
      }
    }
  }

  * renderNew(ctx) {

  }

  * renderRenew(ctx) {

  }

  * renderUpdate(ctx) {

  }

  * renderVerify(ctx) {

  }

  * new(ctx) {

  }

  * renew(ctx) {

  }

  * update(ctx) {

  }
}

module.exports = { MemberRoutes }
