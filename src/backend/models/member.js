"use strict"

const Promise = require("bluebird").Promise
const uuid = require("node-uuid")
const moment = require("moment")

const logger = require("../lib/logger")

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

      createFromFormData(data) {
        const Address = sequelize.models.Address

        function createHash() {
          return uuid.v4()
        }

        function save(member) {
          return Member.create.bind(Member)(member)
        }

        function setupMember(newMember) {
          return (residentialAddress, postalAddress) => {
            return {
              id: createHash(),
              email: newMember.email,
              givenNames: newMember.firstName,
              dateOfBirth: moment(newMember.dateOfBirth, "DD/MM/YYYY").toDate(),
              surname: newMember.lastName,
              gender: newMember.gender,
              primaryPhoneNumber: newMember.primaryPhoneNumber,
              secondaryPhoneNumber: newMember.secondaryPhoneNumber,
              type: "new", // TODO figure out what actually valid values are here
              membershipType: newMember.membershipType,
              verified: null,
              verificationHash: createHash(),
              memberSince: moment().format("L"),
              expiresOn: moment().add(1, "year").format("L"), // FIXME should be config
              lastRenewalReminder: moment().format("L"), // FIXME should initially by NULL
              renewalHash: null,
              residentialAddressId: residentialAddress[0].dataValues.id,
              postalAddressId: postalAddress[0].dataValues.id
            }
          }
        }

        function getMemberAddresses(newMember) {
          return [
            Address.findOrCreate({ where: newMember.residentialAddress, defaults: newMember.residentialAddress }),
            Address.findOrCreate({ where: newMember.postalAddress, defaults: newMember.postalAddress })
          ]
        }

        return Promise.all(getMemberAddresses(data))
          .spread(setupMember(data))
          .then(save)
          .then((savedMember) => {
            return savedMember.dataValues
          })
          .catch((error) => {
            console.error("create-member", "Failed to create member", { error: error.errors, member: data })
            return Promise.reject(new Error("Failed to create member"))
          })
      },

      shouldSendRenewalReminder() {
        if (this.lastRenewalReminder == null) {
          return true
        }

        const fortnight = +moment(this.lastRenewalReminder).add(14, "days").toDate()

        return fortnight < Date.now()
      }
    },
    instanceMethods: {
      sendVerificationEmail() {
        // FIXME
      }
    }
  })

  return Member
}
