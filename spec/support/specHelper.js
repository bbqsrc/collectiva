"use strict"

const models = require("../../src/backend/models")

function* resetTestDatabase() {
  for (const model of ["Invoice", "Address", "Member", "AdminUser"]) {
    try {
      models[model].truncate({ cascade: true })
    } catch (err) {
      // &shrug;
      continue
    }
  }
}

module.exports = {
  resetTestDatabase
}
