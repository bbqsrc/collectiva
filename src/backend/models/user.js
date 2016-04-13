"use strict"

const strategy = require("passport-local-sequelize")

module.exports = (sequelize, DataTypes) => {
  const User = strategy.defineUser(sequelize, {
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  })

  return User
}
