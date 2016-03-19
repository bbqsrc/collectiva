"use strict"

const { endpoints } = require("koa-rutt")

class Payments {
  [endpoints]() {
    const name = this.name

    if (!name) {
      throw new TypeError("Subclass must provide this.name")
    }

    return {
      get: {
        [`/payment/${name}`]: this.generateToken
      },
      post: {
        [`/payment/${name}`]: this.processPayment
      }
    }
  }
}

module.exports = { Payments }
