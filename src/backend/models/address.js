"use strict"

module.exports = (sequelize, DataTypes) => {
  const Address = sequelize.define("Address", {
    country: DataTypes.STRING,
    address: DataTypes.STRING,
    suburb: DataTypes.STRING,
    state: DataTypes.STRING,
    postcode: { type: DataTypes.STRING, validate: { len: [4, 17] } }
  }, {
    classMethods: {
      associate: (models) => {
        Address.hasOne(models.Member, { foreignKey: "postalAddressId" })
        Address.hasOne(models.Member, { foreignKey: "residentialAddressId" })
      }
    }
  })

  return Address
}
