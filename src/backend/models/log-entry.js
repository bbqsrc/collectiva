"use strict"

module.exports = (sequelize, DataTypes) => {
  const LogEntry = sequelize.define("LogEntry", {
    timestamp: { type: DataTypes.DATE, allowNull: false },
    action: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    severity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0, max: 10 }
    },
    meta: DataTypes.JSONB
  }, {
    timestamps: false,
    classMethods: {
      associate: function(models) {
        LogEntry.belongsTo(models.AdminUser, { as: "user", foreignKey: "userId" })
      }
    }
  })

  LogEntry.associate(sequelize.models)

  LogEntry.sync({force: true})

  return LogEntry
}
