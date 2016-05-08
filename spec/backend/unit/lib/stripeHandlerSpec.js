"use strict"

const stripe = require("stripe"),
      stripeHandler = require("../../../../src/backend/lib/stripeHandler")

describe("stripeHandler", function() {
  this.timeout(10000)


  if (stripeHandler.hasConfig) {
    let createStub,
        stripeToken,
        totalAmount,
        expectedNewCharge

    beforeEach(function() {
      createStub = sinon.stub()

      sinon.stub(stripe, "Stripe")
        .returns({ charges: { create: createStub } })

      stripeToken = { id: 1 }
      totalAmount = 60
      expectedNewCharge = {
        amount: 6000,
        currency: "aud",
        source: 1,
        description: "Pirate party membership."
      }
    })

    afterEach(function() {
      stripe.Stripe.restore()
    })

    it("Charge Credit Card", function* () {
      yield stripeHandler.chargeCard(stripeToken, totalAmount)
      expect(createStub.calledWith(expectedNewCharge)).to.be.true
    })
  } else {
    it("should have a defined config but currently does not")
  }
})
