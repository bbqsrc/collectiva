"use strict"

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoice", {
    totalAmountInCents: DataTypes.BIGINT,
    paymentDate: DataTypes.DATE,
    paymentMethod: DataTypes.STRING,
    reference: DataTypes.STRING,
    paymentStatus: DataTypes.STRING,
    transactionId: DataTypes.STRING
  }, {
    classMethods: {
      associate: (models) => {
        Invoice.belongsTo(models.Member, { as: "member" })
      }
    }
  })

  return Invoice
}
