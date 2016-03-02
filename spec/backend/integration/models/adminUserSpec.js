"use strict"

const specHelper = require("../../../support/specHelper.js"),
      expect = require("chai").expect,
      AdminUser = require("../../../../src/backend/models/index").AdminUser

require("co-mocha")

describe("AdminUser", function() {
  beforeEach(specHelper.resetTestDatabase)

  const email = "test@email.invalid",
        password = "testpassword"

  describe("authenticate", function() {
    it("calls back with the user if the user exists and can be authenticated", function*(done) {
      yield AdminUser.create({ email, password })

      AdminUser.authenticate(email, password, (err, res) => {
        expect(res.email).to.equal(email)
        done(err)
      })
    })

    it("calls back with false if the user exists but cannot be authenticated", function*(done) {
      yield AdminUser.create({ email, password })

      AdminUser.authenticate(email, "badpassword", (err, res) => {
        expect(res).to.be.false
        done(err)
      })
    })

    it("calls back with false if the user does not exist", function*(done) {
      AdminUser.authenticate("no@person.invalid", "irrelevant", (err, res) => {
        expect(res).to.be.false
        done(err)
      })
    })
  })

  describe("instance", function() {
    it("has an encrypted password", function*() {
      const user = yield AdminUser.create({ email, password })

      expect(user.password).to.exist
      expect(user.password).not.to.equal(password)
    })
  })
})
