"use strict"

const extend = require("extend")
const config = require("./index")

module.exports = {
  [config.env]: extend({}, config.database, { dialect: "postgresql" })
}
