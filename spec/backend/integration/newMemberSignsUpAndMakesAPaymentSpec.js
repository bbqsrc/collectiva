"use strict"

require("co-mocha")

const request = require("supertest-as-promised")
const expect = require("chai").expect

const instanceUrl = process.env.INSTANCE_URL

function makeMemberWithEmail(email) {
  return {
    firstName: "Sherlock",
    lastName: "Holmes",
    email,
    dateOfBirth: "22/12/1900",
    primaryPhoneNumber: "0396291146",
    secondaryPhoneNumber: null,
    gender: "horse radish",
    residentialAddress: {
      address: "222b Baker St",
      suburb: "London",
      country: "England",
      state: "VIC",
      postcode: "1234"
    },
    postalAddress: {
      address: "303 collins st",
      suburb: "melbourne",
      country: "australia",
      state: "VIC",
      postcode: "3000"
    },
    membershipType: "full"
  }
}

describe("User Flow", function() {
  let app,
      member

  function createMember(data) {
    return request(app)
      .post("/members")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send(data)
  }

  function sendPayment(invoice) {
    return request(app)
      .post("/invoices/update")
      .set("Content-Type", "application/json")
      .set("Accept", "application/json")
      .send(invoice)
  }

  beforeEach(function() {
    app = instanceUrl || require("../../../src/backend/app")

    member = makeMemberWithEmail(`sherlock${Date.now()}@holmes.invalid`)
  })

  it("member sign up with duplicate email should fail", function*() {
    const res = yield createMember(member)

    expect(res.body).to.have.all.keys("newMember", "invoiceId")

    const res2 = yield createMember(member)

    expect(res2.statusCode).to.equal(409)
  })

  it("a new member successfully signs up and then makes a payment", function*() {
    const res = yield createMember(member)

    const invoiceData = {
      totalAmount: "88.88",
      paymentType: "deposit",
      invoiceId: res.body.invoiceId
    }

    const res2 = yield sendPayment(invoiceData)

    expect(res2.statusCode).to.equal(200)
  })
})
