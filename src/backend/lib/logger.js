"use strict"

const winston = require("winston"),
      models = require("../models")

const { Logger, Transport, transports } = winston

// { emerg: 0, alert, crit, error, warning, notice, info, debug: 7 }
winston.setLevels(winston.config.syslog.levels)

class ActionLogger extends Logger {
  log(level, action, message, userId, meta) {
    const data = { action }

    if (typeof userId !== "number") {
      data.meta = userId
    } else {
      data.userId = userId
      data.meta = meta
    }

    const pLog = super.log

    return new Promise((resolve, reject) => {
      pLog(level, message, data, (err) => {
        return err ? reject(err) : resolve()
      })
    })
  }
}

class DatabaseTransport extends Transport {
  constructor(options) {
    super(options)
    this.name = "database"
    this.level = options.level || "info"
  }

  log(severity, message, data, callback) {
    const { action, meta, user } = data
    const timestamp = new Date()

    models.LogEntry.create({
      timestamp, severity, message, action, user, meta
    })
    .then(() => callback(null, true))
    .catch(err => callback(err, false))
  }
}

class ConsoleTransport extends transports.Console {
  timestamp() {
    return new Date().toISOString()
  }

  formatter(opts) {
    const { action, meta, userId } = opts.meta
    const message = opts.message || "(no message provided)"
    const timestamp = opts.timestamp()
    const level = opts.level.toUpperCase()

    let base = `${timestamp} [${level}] [${action}] ${message}`

    if (userId != null) {
      base += ` (User: ${userId})`
    }

    if (meta) {
      base += `\n  ${JSON.stringify(meta)}`
    }

    return base
  }
}

// TODO: change levels based on env
const logger = new ActionLogger({
  levels: winston.config.syslog.levels,
  transports: [
    new ConsoleTransport({
      level: "info"
    }),
    new DatabaseTransport({
      level: "notice"
    })
  ]
})

module.exports = logger
