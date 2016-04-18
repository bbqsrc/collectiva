"use strict"

const { Promise } = require("bluebird"),
      nodemailer = Promise.promisifyAll(require("nodemailer")),
      config = require("configsomehow")

if (!config.mail.transport) {
  throw new Error("No mail.transport defined in config")
}

const transport = nodemailer.createTransport(config.mail)

class EmailService {
  * send(email, member) {
    const body = email.template(member)

    const data = {
      to: member.email,
      from: email.from,
      subject: email.subject,
      text: body
    }

    yield transport.sendMailAsync(data)
  }
}

module.exports = new EmailService()
