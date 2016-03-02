"use strict"

require("../../support/specHelper.js")

const messagingService = require("../../../src/backend/services/messagingService")
const sinon = require("sinon")
const member = { email: "sherlock@holmes.co.uk", verificationHash: "shhhaaaaaa" }
const config = require("config")

require("co-mocha")
const chai = require("chai")
const expect = chai.expect

chai.use(require("chai-as-promised"))

const nodemailer = require("nodemailer")


describe("Sending emails", function() {
  let transportStub
  let configStub
  let sendMailSpy

  beforeEach(function() {
    configStub = sinon.stub(config, "get")
    configStub.withArgs("email.sendEmails").returns(true)
  })

  afterEach(function() {
    nodemailer.createTransport.restore()
    config.get.restore()
  })

  describe("upon success", function() {
    beforeEach(function() {
      transportStub = {
        sendMail(options, callback) {
          callback(false, true)
        }
      }

      sendMailSpy = sinon.spy(transportStub, "sendMail")
      sinon.stub(nodemailer, "createTransport").returns(transportStub)
    })

    it("should send an email to the member", function*() {
      yield messagingService.sendVerificationEmail(member)
      expect(sendMailSpy.called).to.be.true
    })

    it("should not send an email if disabled in configuration", function*() {
      configStub.withArgs("email.sendEmails").returns(false)

      yield messagingService.sendVerificationEmail(member)
      expect(sendMailSpy.called).to.be.false
    })
  })

  describe("upon failure", function() {
    beforeEach(function() {
      transportStub = {
        sendMail(options, callback) {
          callback(true, false)
        }
      }

      sendMailSpy = sinon.spy(transportStub, "sendMail")
      sinon.stub(nodemailer, "createTransport").returns(transportStub)
    })

    it("should throw an error when something unexpected happens", function*() {
      expect(messagingService.sendVerificationEmail(member))
        .to.eventually.be.rejected
    })
  })
})
