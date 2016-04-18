"use strict"

const fs = require("fs"),
      path = require("path"),
      Sequelize = require("sequelize"),
      basename = path.basename(module.filename)

const db = {}

const config = require("../../../config").database
const connection = new Sequelize(config.database, config.username, config.password, {
  dialect: "postgresql",
  host: config.host,
  port: config.port
})

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf(".") !== 0) && (file !== basename) && (file.slice(-3) === ".js")
  })
  .forEach(file => {
    const model = connection.import(path.join(__dirname, file))

    db[model.name] = model
  })

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
})

connection.sync()

db.sequelize = connection
db.Sequelize = Sequelize

module.exports = db
