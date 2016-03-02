"use strict" /* eslint-disable no-console,no-process-env,no-process-exit */

const models = require("../models")
const readline = require("readline")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})
const envEmail = process.env.ACCEPTANCE_EMAIL
const envPassword = process.env.ACCEPTANCE_PASSWORD

function createUser(email, password) {
  models.User.create({ email, password }).then(user => {
    console.log(`User "${user.email} created.`)
    process.exit(0)
  }).catch(err => {
    console.error("Error: Could not make admin user")
    console.error(err.stack)
    process.exit(1)
  })
}

if (envEmail && envPassword) {
  createUser(envEmail, envPassword)
} else {
  rl.question("Email: ", email => {
    rl.question("Password: ", password => {
      createUser(email, password)
    })
  })
}
