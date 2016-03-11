"use strict"

const invoiceService = require("../../../../src/backend/services/invoiceService"),
      memberService = require("../../../../src/backend/services/memberService"),
      messagingService = require("../../../../src/backend/services/messagingService"),
      memberValidator = require("../../../../src/lib/memberValidator"),
      Promise = require("bluebird").Promise

const membersController = require("../../../../src/backend/controllers/membersController")
const newMemberHandler = membersController.newMemberHandler

const residentialAddress = {
  address: "221b Baker St",
  suburb: "London",
  country: "England",
  state: "VIC",
  postcode: "1234"
}

const postalAddress = {
  address: "47 I dont want your spam St",
  suburb: "Moriarty",
  country: "USA",
  state: "NM",
  postcode: "5678"
}

function generateGoodRequest() {
  return {
    body: {
      firstName: "Sherlock",
      lastName: "Holmes",
      email: "sherlock@holmes.co.uk",
      gender: "detective genius",
      dateOfBirth: "22/12/1900",
      primaryPhoneNumber: "0396291146",
      secondaryPhoneNumber: "0394291146",
      residentialAddress,
      postalAddress,
      membershipType: "full"
    }
  }
}

describe("membersController", function() {
  describe("newMemberHandler", function() {
    let validateMemberStub,
        createMemberStub,
        createInvoiceStub,
        sendVerificationEmailStub,
        jsonStub,
        res

    beforeEach(function() {
      const goodRequest = generateGoodRequest()

      createMemberStub = sinon.stub(memberService, "createMember")
        .withArgs(goodRequest.body)

      createInvoiceStub = sinon.stub(invoiceService, "createEmptyInvoice")
        .withArgs(goodRequest.body.email, goodRequest.body.membershipType)

      validateMemberStub = sinon.stub(memberValidator, "isValid")

      sendVerificationEmailStub = sinon.stub(messagingService, "sendVerificationEmail")

      jsonStub = sinon.spy()

      res = {
        status: sinon.stub().returns({ json: jsonStub })
      }
    })

    afterEach(function() {
      memberService.createMember.restore()
      invoiceService.createEmptyInvoice.restore()
      memberValidator.isValid.restore()
      messagingService.sendVerificationEmail.restore()
    })

    describe("when it receives a good request", function() {
      // let expectedMemberCreateValues

      const createdMember = {
        id: "1234",
        membershipType: "full",
        email: "sherlock@holmes.co.uk"
      }

      beforeEach(function() {
        validateMemberStub.returns([])
        createMemberStub.returns(Promise.resolve(createdMember))
        createInvoiceStub.returns(Promise.resolve({ id: "1" }))
        sendVerificationEmailStub.returns(Promise.resolve())

        // TODO investigate why this is entirely unused
        /*
        expectedMemberCreateValues = {
          firstName: "Sherlock",
          lastName: "Holmes",
          email: "sherlock@holmes.co.uk",
          gender: "detective genius",
          dateOfBirth: "22/12/1900",
          primaryPhoneNumber: "0396291146",
          secondaryPhoneNumber: "0394291146",
          residentialAddress,
          postalAddress,
          membershipType: "full"
        }
        */
      })

      it("creates a new member", function*() {
        yield newMemberHandler(generateGoodRequest(), res)

        expect(res.status.calledWith(200)).to.be.true
        expect(jsonStub.calledWith({
          invoiceId: "1",
          newMember: { email: createdMember.email }
        })).to.be.true
        expect(messagingService.sendVerificationEmail.calledWith(createdMember)).to.be.true
      })
    })

    describe("when validation fails", function() {
      it("responds with status 400", function*() {
        validateMemberStub.returns(["firstName"])

        yield newMemberHandler(generateGoodRequest(), res)

        expect(memberService.createMember.called).to.be.false
        expect(res.status.calledWith(400)).to.be.true
      })
    })
  })

  describe("verify", function() {
    let res,
        verificationStub

    beforeEach(function() {
      res = {
        redirect: sinon.spy(),
        render: sinon.spy(),
        sendStatus: sinon.spy()
      }

      verificationStub = sinon.stub(memberService, "verify")
    })

    afterEach(function() {
      memberService.verify.restore()
    })

    it("should return 400 when the hash is not valid", function*() {
      const req = {
        params: {
          hash: "ZZZZZooooWrong"
        }
      }

      try {
        yield membersController.verify(req, res)
      } catch (error) {
        expect(verificationStub.called).to.be.false
        expect(res.sendStatus.calledWith(400)).to.be.true
      }
    })

    it("redirect to /verified when account successfully verified", function*() {
      verificationStub.returns(Promise.resolve({ email: "sherlock@holmes.co.uk", verified: true }))

      const req = {
        params: {
          hash: "1d225bd0-57b5-4b87-90fc-f76ddc997e57"
        }
      }

      yield membersController.verify(req, res)
      expect(verificationStub.calledWith(req.params.hash)).to.be.true
      expect(res.redirect.calledWith("/verified")).to.be.true
    })

    it("should return a 400 when the account could not be verified", function*() {
      verificationStub(Promise.reject(new Error("The account could not be verified")))

      const req = {
        params: {
          hash: "1d225bd0-57b5-4b87-90fc-f76ddc997e57"
        }
      }

      yield membersController.verify(req, res)
      expect(verificationStub.calledWith(req.params.hash)).to.be.true
      expect(res.sendStatus.calledWith(400)).to.be.true
    })
  })
})
