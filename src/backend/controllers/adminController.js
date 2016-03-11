"use strict"

const co = require("co")

const memberService = require("../services/memberService")
const invoiceService = require("../services/invoiceService")

function membersList(req, res) {
  return co(function* () {
    try {
      const members = yield memberService.list()

      res.status(200).json({ members })
    } catch (error) {
      res.status(500).json({ error })
    }
  })
}

function unconfirmedPaymentsMembersList(req, res) {
  return co(function* () {
    try {
      const members = yield invoiceService.unconfirmedPaymentList()

      res.status(200).json({ members })
    } catch (error) {
      res.status(500).json({ error })
    }
  })
}

module.exports = {
  membersList,
  unconfirmedPaymentsMembersList
}
