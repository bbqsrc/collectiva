"use strict"

const invoiceService = require("../../../../src/backend/services/invoiceService"),
      memberService = require("../../../../src/backend/services/memberService"),
      adminController = require("../../../../src/backend/controllers/adminController"),
      Promise = require("bluebird").Promise

describe("adminController", function() {
  let resMock, reqMock
  let jsonStub, memberList

  beforeEach(function() {
    jsonStub = sinon.stub()

    resMock = {
      status: sinon.stub().returns({ json: jsonStub })
    }

    reqMock = {}

    memberList = [{ firstName: "bob" }]
  })

  describe("membersList", function() {
    const membersList = adminController.membersList

    beforeEach(function() {
      sinon.stub(memberService, "list")
    })

    afterEach(function() {
      memberService.list.restore()
    })

    it("responds with a list of members", function*() {
      memberService.list.returns(Promise.resolve(memberList))

      yield membersList(reqMock, resMock)

      expect(resMock.status.calledWith(200)).to.be.true
      expect(jsonStub.args[0][0].members[0].firstName).to.equal("bob")
    })

    it("responds with an error list of members", function*() {
      const error = "Liar liar pants on fire"

      memberService.list.returns(Promise.reject(error))

      yield membersList(reqMock, resMock)

      expect(resMock.status.calledWith(500)).to.be.true
      expect(jsonStub.calledWith({ error })).to.be.true
    })
  })

  describe("unconfirmedPaymentsMembersList", function() {
    const membersList = adminController.unconfirmedPaymentsMembersList

    beforeEach(function() {
      sinon.stub(invoiceService, "unconfirmedPaymentList")
    })

    afterEach(function() {
      invoiceService.unconfirmedPaymentList.restore()
    })

    it("responds with a list of unconfirmed payments", function*() {
      invoiceService.unconfirmedPaymentList.returns(Promise.resolve(memberList))

      yield membersList(reqMock, resMock)

      expect(resMock.status.calledWith(200)).to.be.true
      expect(jsonStub.args[0][0].members[0].firstName).to.equal("bob")
    })

    it("responds with an error list of unconfirmed payments", function*() {
      const error = "Liar liar pants on fire"

      invoiceService.unconfirmedPaymentList.returns(Promise.reject(error))

      yield membersList(reqMock, resMock)

      expect(resMock.status.calledWith(500)).to.be.true
      expect(jsonStub.calledWith({ error })).to.be.true
    })
  })
})
