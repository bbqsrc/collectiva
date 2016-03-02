"use strict"

require("../../support/specHelper")

const paymentValidator = require("../../../src/lib/paymentValidator")

require("co-mocha")
const chai = require("chai")
const expect = chai.expect

describe("paymentValidator", function() {
  describe("isValid", function() {
    const validPayment = {
      totalAmount: "100",
      paymentType: "cheque",
      invoiceId: "1"
    }

    it("should return empty array of errors on valid payment", function() {
      expect(paymentValidator.isValid(validPayment)).to.be.empty
    })

    it("should return array of errors on null payment", function() {
      expect(paymentValidator.isValid(null)).not.to.be.empty
    })
  })

  describe("isValidAmount", function() {
    it("Should return true given a numberic amount string", function() {
      expect(paymentValidator.isValidAmount("123.2")).to.be.true
    })

    it("Should return true given a postive numberic no less than 1", function() {
      expect(paymentValidator.isValidAmount(2)).to.be.true
    })

    ;["", "-1", 0.1, -1, "abc", ""].forEach((testCase) => {
      it(`Should return false if name is ${testCase}`, function() {
        expect(paymentValidator.isValidAmount(testCase)).to.be.false
      })
    })
  })

  describe("isValidPaymentType", function() {
    it("Should return true given a normal string", function() {
      expect(paymentValidator.isValidPaymentType("deposit")).to.be.true
    })

    ;["", null].forEach((testCase) => {
      it(`Should return false if name is ${testCase}`, function() {
        expect(paymentValidator.isValidPaymentType(testCase)).to.be.false
      })
    })
  })

  describe("isValidId", function() {
    it("Should return true given a numberic id", function() {
      expect(paymentValidator.isValidId("1")).to.be.true
      expect(paymentValidator.isValidId(1)).to.be.true
    })

    ;["", null, "string"].forEach((testCase) => {
      it(`Should return false if id is ${testCase}`, function() {
        expect(paymentValidator.isValidId(testCase)).to.be.false
      })
    })
  })

  describe("isValidNoContribute", function() {
    const validPayment = {
      totalAmount: 0,
      paymentType: "noContribute",
      invoiceId: "1"
    }

    it("should return empty array of errors on valid payment", function() {
      expect(paymentValidator.isValidNoContribute(validPayment)).to.be.empty
    })

    it("should return array of errors on null payment", function() {
      expect(paymentValidator.isValidNoContribute(null)).not.to.be.empty
    })
  })
})
