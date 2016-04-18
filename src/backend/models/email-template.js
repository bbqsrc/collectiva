"use strict"

const handlebars = require("handlebars")

module.exports = (sequelize, DataTypes) => {
  const EmailTemplate = sequelize.define("EmailTemplate", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    from: { type: DataTypes.STRING, allowNull: false },
    subject: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    metadata: { type: DataTypes.JSONB }
  }, {
    classMethods: {
      findByName(name) {
        return EmailTemplate.findOne({ where: { name } })
      }
    },
    instanceMethods: {
      template(data) {
        return handlebars.compile(this.body)(data)
      }
    }
  })

  return EmailTemplate
}
