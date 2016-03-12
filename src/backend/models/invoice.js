"use strict"

module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define("Invoice", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    memberEmail: DataTypes.STRING,
    totalAmountInCents: DataTypes.BIGINT,
    paymentDate: DataTypes.DATE,
    paymentType: DataTypes.STRING,
    reference: DataTypes.STRING,
    paymentStatus: DataTypes.STRING,
    transactionId: DataTypes.STRING
  }, {
    classMethods: {
      associate: (models) => {
        Invoice.belongsTo(models.Member, { as: "member", foreignKey: "memberEmail" })
      }
    }
  })

  return Invoice
}
