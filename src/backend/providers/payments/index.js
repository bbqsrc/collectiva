"use strict"

const { endpoints } = require("koa-rutt")

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

class Payments {
  [endpoints]() {
    const name = this.name

    if (!name) {
      throw new TypeError("Subclass must provide this.name")
    }

    return {
      get: {
        [`/payment/${name}`]: this.generateToken.bind(this)
      },
      post: {
        [`/payment/${name}`]: json(this.processPayment.bind(this))
      }
    }
  }
}

module.exports = { Payments }
