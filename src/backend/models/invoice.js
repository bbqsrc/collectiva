"use strict"

const moment = require("moment")
const uuid = require("node-uuid")

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoice", {
    totalAmountInCents: DataTypes.BIGINT,
    paymentDate: DataTypes.DATE,
    paymentMethod: DataTypes.STRING,
    reference: DataTypes.STRING,
    paymentStatus: DataTypes.STRING, // TODO: use an enum instead?
    transactionId: DataTypes.STRING
  }, {
    classMethods: {
      associate: (models) => {
        Invoice.belongsTo(models.Member, { as: "member" })
      },

      createFromFormData(paymentMethod, data) {
        return Invoice.create({
          paymentMethod,
          // TODO: Check that this conversion is correct:
          totalAmountInCents: Math.floor(parseFloat(data.amount) * 100),
          paymentDate: moment().format("L"),
          reference: data.memberId,
          paymentStatus: data.status || "new",
          transactionId: uuid.v4()
        })
      }
    }
  })

  return Invoice
}
