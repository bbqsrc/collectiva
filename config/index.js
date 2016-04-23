"use strict"

const extend = require("extend")
const env = process.env.NODE_ENV || "development"

let overlay

try {
  overlay = require(`./${env}.json`)
  console.info(`Config provided for env "${env}"!`)
} catch (e) {
  console.error(`No config provided for env "${env}"; using defaults!`)
  overlay = {}
}

const config = Object.assign(true, {
  database: {
    database: "collectiva",
    username: "collectiva",
    password: "collectiva",
    host: "127.0.0.1",
    port: 5432
  }
}, overlay, { env })

module.exports = Object.freeze(config)
