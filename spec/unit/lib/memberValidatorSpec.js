"use strict"

const moment = require("moment")
const _ = require("lodash")

require("../../support/specHelper")

const memberValidator = require("../../../src/lib/memberValidator")

require("co-mocha")
const chai = require("chai")
const expect = chai.expect

describe("memberValidator", function() {
  describe("isValid", function() {
    const validMember = {
      firstName: "Sherlock",
      lastName: "Holmes",
      gender: "horse radish",
      email: "sherlock@holmes.co.uk",
      dateOfBirth: "22/12/1900",
      primaryPhoneNumber: "0396291146",
      secondaryPhoneNumber: "0396291146",
      residentialAddress: {
        address: "222b Baker St",
        suburb: "London",
        country: "England",
        state: "VIC",
        postcode: ".-0123string"
      },
      postalAddress: {
        address: "303 collins st",
        suburb: "melbourne",
        country: "Australia",
        state: "VIC",
        postcode: "3000"
      },
      membershipType: "full"
    }

    const optionalFields = ["secondaryPhoneNumber", "gender"]
    const validMemberWithoutOptionalFields = _.omit(validMember, optionalFields)

    it("should return empty array of errors on valid member", function() {
      expect(memberValidator.isValid(validMember)).to.be.empty
    })

    it("should return empty array of errors on valid member without optional fields", function() {
      expect(memberValidator.isValid(validMemberWithoutOptionalFields)).to.be.empty
    })

    it("should return array of errors on null member", function() {
      expect(memberValidator.isValid(null)).not.to.be.empty
    })
  })

  describe("isValidName", function() {
    it("Should return true given an alpha name", function() {
      expect(memberValidator.isValidName("aaa")).to.be.true
    })

    it("Should return true if name is a alphanumeric", function() {
      expect(memberValidator.isValidName("Flo the 1st")).to.be.true
    })

    ;["", null, "a".repeat(256), "Flo the 1st<"].forEach((testCase) => {
      it(`Should return false if name is ${testCase}`, function() {
        expect(memberValidator.isValidName(testCase)).to.be.false
      })
    })
  })

  describe("isValidGender", function() {
    ["aaa", "Flo the 1st", "", null].forEach((testCase) => {
      it(`Should return true if name is ${testCase}`, function() {
        expect(memberValidator.isValidGender(testCase)).to.be.true
      })
    })

    ;["a".repeat(256), "Flo the 1st<"]
    .forEach((testCase) => {
      it(`Should return false if name is ${testCase}`, function() {
        expect(memberValidator.isValidGender(testCase)).to.be.false
      })
    })
  })

  describe("isValidEmail", function() {
    it("Should return true given a string with an '@' and a '.'", function() {
      expect(memberValidator.isValidEmail("aaa@attt.com")).to.be.true
    })
  })

  describe("isValidPrimaryPhoneNumber", function() {
    [
      "+61472817381",
      "0328171381",
      "0428171331",
      "04-2817-133-1",
      "04 2817 1331",
      "+1555-555-5555",
      "+1(555)555-5555",
      "+65 2345 7908",
      "+18-1111-1111111"
    ].forEach((testCase) => {
      it(`Should return true given a string with a mobile phone number ${testCase}`, function() {
        expect(memberValidator.isValidPhone(testCase)).to.be.true
      })
    });

    ["", null, "words?"].forEach((testCase) => {
      it(`Should return false if phone is ${testCase}`, function() {
        expect(memberValidator.isValidPhone(testCase)).to.be.false
      })
    })
  })

  describe("isValidDateOfBirth", function() {
    it("Should return true given a string with a dateOfBirth", function() {
      expect(memberValidator.isValidDate("22/12/1900")).to.be.true
    })

    it("Should return true if the user is 16 years old", function() {
      const date = moment().subtract(16, "years").format("DD/MM/YYYY")

      expect(memberValidator.isValidDate(date)).to.be.true
    })

    it("Should return false if the user is under 16 years old", function() {
      const date = moment().subtract(16, "years").add(1, "days").format("L")

      expect(memberValidator.isValidDate(date)).to.be.false
    })

    const testCases = [
      null,
      "",
      "21 Dec 2015",
      moment().add(7, "days"),
      "222/12/1900"
    ]

    testCases.forEach((input) => {
      it(`Should return false given a ${input} dateOfBirth`, function() {
        expect(memberValidator.isValidDate(input)).to.be.false
      })
    })
  })

  describe("isValidAddress", function() {
    let validAddress = {}

    beforeEach(function() {
      validAddress = {
        address: "221b Baker St",
        suburb: "London",
        country: "Australia",
        state: "VIC",
        postcode: "1234"
      }
    })

    ;[
      { address: null },
      { address: "" },
      { address: "a".repeat(256) },

      { suburb: null },
      { suburb: "" },
      { suburb: "a".repeat(256) },

      { state: null },
      { state: "" },

      { country: null },
      { country: "" },
      { country: "a".repeat(256) },
      { country: "Select Country" }
    ].forEach((failingTestScenario) => {
      it(`Should return false if given ${JSON.stringify(failingTestScenario)}`, function() {
        expect(memberValidator.isValidAddress(
          _.merge(validAddress, failingTestScenario))).not.to.be.empty
      })
    })

    it("Should return empty array given an address object", function() {
      expect(memberValidator.isValidAddress(validAddress)).to.be.empty
    })

    it("Should return empty array given an address object with postcode as int for Australian address", function() {
      validAddress.postcode = 1234
      expect(memberValidator.isValidAddress(validAddress)).to.be.empty
    })

    it("Should return empty array given an address object with postcode as int for international address", function() {
      validAddress.country = "England"
      validAddress.postcode = 12345678
      expect(memberValidator.isValidAddress(validAddress)).to.be.empty
    })

    it("Should return array of errors if address is null", function() {
      expect(memberValidator.isValidAddress(null)).not.to.be.empty
    })

    it("Should return array with 1 error given an address with no state", function() {
      validAddress.state = null
      expect(memberValidator.isValidAddress(validAddress)).to.have.lengthOf(1)
    })

    ;[
      null,
      "",
      "-123",
      "abdt",
      "1".repeat(5)
    ].forEach((failingTestScenario) => {
      it(`For Australia Address, Should return false if given postcode: ${failingTestScenario}`, function() {
        validAddress.postcode = failingTestScenario
        expect(memberValidator.isValidAddress(validAddress)).not.to.be.empty
      })
    })

    ;[
      null,
      "",
      "1".repeat(17)
    ].forEach((failingTestScenario) => {
      it(`For International Address, Should return false if given postcode: ${failingTestScenario}`, function() {
        validAddress.country = "England"
        validAddress.postcode = failingTestScenario
        expect(memberValidator.isValidAddress(validAddress)).not.to.be.empty
      })
    })
  })

  describe("isValidMembershipType", function() {
    it("Should return true if type is full", function() {
      expect(memberValidator.isValidMembershipType("full")).to.be.true
    })

    it("Should return true if type is permanentResident", function() {
      expect(memberValidator.isValidMembershipType("permanentResident")).to.be.true
    })

    it("Should return true if type is full", function() {
      expect(memberValidator.isValidMembershipType("supporter")).to.be.true
    })

    it("Should return true if type is full", function() {
      expect(memberValidator.isValidMembershipType("internationalSupporter")).to.be.true
    });

    [
      "",
      null,
      "a".repeat(256),
      "Flo the 1st<",
      "fulla"
    ].forEach((testCase) => {
      it(`Should return false if type is ${testCase}`, function() {
        expect(memberValidator.isValidMembershipType(testCase)).to.be.false
      })
    })
  })
})
