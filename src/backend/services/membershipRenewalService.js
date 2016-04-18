"use strict"

const { CronJob } = require("cron")
const moment = require("moment")
const co = require("co")
const uuid = require("node-uuid")

const { EmailTemplate, Member } = require("../models")
const { emailService } = require("./email")
const logger = require("../lib/logger")

const everyDayAt0730 = "00 30 7 * * *"

function* worker() {
  const email = yield EmailTemplate.findByName("renewal")
  const ninetyDaysFromNow = moment().add(90, "days").toDate()
  const members = yield Member.expiringOn(ninetyDaysFromNow)

  for (const member of members) {
    if (!member.renewalHash) {
      member.renewalHash = uuid.v4()
      yield member.save()
    }

    try {
      yield emailService.send(email, member)
    } catch (error) {
      logger.crit("member-renewal-service",
        "An error occurred while sending renewal notifications",
        { emailName: email.name, memberId: member.id, error }
      )
    }
  }

  logger.info("member-renewal-service",
    `Notifications process finished; sent: ${members.length}`,
    { count: members.length }
  )
}

function start() {
  const job = new CronJob({
    cronTime: everyDayAt0730,
    onTick: co.wrap(worker),
    start: false
  })

  job.start()
}

module.exports = {
  start
}
