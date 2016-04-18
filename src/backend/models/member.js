"use strict"

const uuid = require("node-uuid")
const moment = require("moment")

const EXCLUDED_TYPES = ["resigned", "suspended", "expelled"]

module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define("Member", {
    id: { type: DataTypes.UUID, defaultValue: uuid.v4(), primaryKey: true },
    email: { type: DataTypes.STRING, unique: true },
    givenNames: DataTypes.STRING,
    dateOfBirth: DataTypes.DATEONLY,
    surname: DataTypes.STRING,
    gender: DataTypes.STRING,
    primaryPhoneNumber: DataTypes.STRING,
    secondaryPhoneNumber: DataTypes.STRING,
    type: DataTypes.STRING,
    verified: { type: DataTypes.DATE, allowNull: true },
    verificationHash: { type: DataTypes.STRING, allowNull: true },
    memberSince: { type: DataTypes.DATE, allowNull: false },
    expiresOn: { type: DataTypes.DATE, allowNull: false },
    lastRenewalReminder: { type: DataTypes.DATE, allowNull: false },
    renewalHash: { type: DataTypes.UUID, allowNull: true }
  }, {
    classMethods: {
      associate: (models) => {
        Member.belongsTo(models.Address, { as: "postalAddress", foreignKey: "postalAddressId" })
        Member.belongsTo(models.Address, { as: "residentialAddress", foreignKey: "residentialAddressId" })
        Member.hasOne(models.Invoice, { foreignKey: "memberEmail" })
      },

      allExpiredOn(date) {
        return Member.find({
          where: {
            expiresOn: { $lt: date },
            type: { $notIn: EXCLUDED_TYPES }
          }
        })
      },

      allCurrent() {
        return Member.find({
          where: {
            expiresOn: { $gt: new Date() },
            type: { $notIn: EXCLUDED_TYPES }
          }
        })
      },

      shouldSendRenewalReminder() {
        if (this.lastRenewalReminder == null) {
          return true
        }

        const fortnight = +moment(this.lastRenewalReminder).add(14, "days").toDate()

        return fortnight < Date.now()
      }
    }
  })

  return Member
}
