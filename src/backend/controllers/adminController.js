"use strict"

const memberService = require("../services/memberService")
const invoiceService = require("../services/invoiceService")

function* membersList(next) {
  try {
    const members = yield memberService.list()

    this.body = { members }
  } catch (error) {
    this.status = 500
    this.body = { error }
  }
}

function* unconfirmedPaymentsMembersList(next) {
  try {
    const members = yield invoiceService.unconfirmedPaymentList()

    this.body = { members }
  } catch (error) {
    this.status = 500
    this.body = { error }
  }
}

module.exports = {
  membersList,
  unconfirmedPaymentsMembersList
}
