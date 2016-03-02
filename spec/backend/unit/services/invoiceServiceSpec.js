"use strict"

const specHelper = require("../../../support/specHelper"),
      stripeHandler = require("../../../../src/backend/lib/stripeHandler"),
      models = require("../../../../src/backend/models"),
      Invoice = models.Invoice,
      moment = require("moment")

const invoiceService = require("../../../../src/backend/services/invoiceService")

describe("invoiceService", function() {
  let createInvoiceStub, updateInvoiceStub,
      findInvoiceStub,
      newInvoice,
      expectedInvoice, createInvoicePromise,
      updateInvoicePromise, findInvoicePromise,
      memberEmail, reference,
      createdEmptyInvoice, invoiceId

  beforeEach(function() {
    createInvoiceStub = sinon.stub(models.Invoice, "create")
    updateInvoiceStub = sinon.stub(models.Invoice, "update")
    findInvoiceStub = sinon.stub(models.Invoice, "findOne")

    invoiceId = 1

    newInvoice = {
      totalAmount: 60,
      paymentType: "deposit",
      paymentDate: moment().format("L"),
      paymentStatus: "Pending",
      invoiceId
    }

    expectedInvoice = {
      invoiceId,
      reference: "FUL1"
    }

    createdEmptyInvoice = { dataValues: { id: 1 } }

    memberEmail = "sherlock@holmes.co.uk"
    reference = "FUL1234"
  })

  afterEach(function() {
    models.Invoice.create.restore()
    models.Invoice.update.restore()
    models.Invoice.findOne.restore()
  })

  describe("create empty invoice", function() {
    let membershipType,
        updatedInovice,
        emptyInvoice

    beforeEach(function() {
      emptyInvoice = {
        memberEmail,
        totalAmountInCents: 0,
        paymentDate: moment().format("L"),
        paymentType: "",
        reference: ""
      }

      membershipType = "full"
      updatedInovice = { dataValues: expectedInvoice }
    })

    it("with member email and membershipType, then update the reference", function(done) {
      createInvoicePromise = Promise.resolve(createdEmptyInvoice)
      findInvoicePromise = Promise.resolve(createdEmptyInvoice)
      updateInvoicePromise = Promise.resolve(updatedInovice)

      invoiceService.createEmptyInvoice(memberEmail, membershipType)
        .then((createdInvoice) => {
          expect(createdInvoice.id).to.equal(expectedInvoice.invoiceId)
        }).then(done)
    })

    it("logs the create empty invoice event", function(done) {
      createInvoicePromise = Promise.resolve(createdEmptyInvoice)
      findInvoicePromise = Promise.resolve(createdEmptyInvoice)
      updateInvoicePromise = Promise.resolve(updatedInovice)

      invoiceService.createEmptyInvoice(memberEmail, membershipType)
        .finally(function() {
          // expect(logger.logCreateEmptyInvoiceEvent.calledWith(createdEmptyInvoice)).to.be.true
          // expect(logger.logUpdateInvoiceEvent.calledWith(1, { reference: "FUL1" })).to.be.true
        }).then(done)
    })

    it("logs the error when create empty invoice failed", function(done) {
      createInvoicePromise = Promise.resolve(createdEmptyInvoice)
      findInvoicePromise = Promise.resolve({})

      const promise = invoiceService.createEmptyInvoice(memberEmail, membershipType)

      promise.catch((error) => {
        expect(error.message).to.equal("An error has occurred internally.")
      }).then(done)
    })

    describe("reject the promise when", function() {
      it("create empty invoice failed", function(done) {
        createInvoicePromise.reject("Seriously, we still don't have any damn bananas.")

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            // done.fail("createEmptyInvoice should have failed, not succeeded, not this time.")
          })
          .catch((error) => {
            expect(error).not.to.exist
            done()
          })
      })

      it("find invoice failed", function(done) {
        createInvoicePromise = Promise.resolve(createdEmptyInvoice)
        findInvoicePromise.reject("Seriously, we still don't have any damn bananas.")

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            // done.fail("createEmptyInvoice should have failed, not succeeded, not this time.")
          })
          .catch((error) => {
            expect(error).not.to.exist
            done()
          })
      })

      it("invoice not found", function(done) {
        createInvoicePromise = Promise.resolve(createdEmptyInvoice)
        findInvoicePromise = Promise.resolve({})

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            // done.fail("createEmptyInvoice should have failed, not succeeded, not this time.")
          })
          .catch((error) => {
            expect(error).not.to.exist
            done()
          })
      })

      it("update invoice failed", function(done) {
        const errorMessage = "Seriously, we still don't have any damn bananas."

        createInvoicePromise = Promise.resolve(createdEmptyInvoice)
        findInvoicePromise = Promise.resolve(invoiceId)
        updateInvoicePromise.reject(errorMessage)

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            // done.fail("createEmptyInvoice should have failed, not succeeded, not this time.")
          })
          .catch((error) => {
            expect(error).not.to.exist
            done()
          })
      })
    })
  })

  describe("pay for invoice", function() {
    describe("Credit Card/Debit Card Payment", function() {
      let stripeHandlerStub, stripeChargePromise,
          stripeToken, totalAmount

      beforeEach(function() {
        newInvoice.paymentType = "stripe"
        newInvoice.paymentStatus = "PAID"
        newInvoice.transactionId = "trans_1"
        newInvoice.stripeToken = "token"

        stripeToken = "47"
        totalAmount = 123

        stripeHandlerStub = sinon.stub(stripeHandler, "chargeCard")
      })

      afterEach(function() {
        stripeHandler.chargeCard.restore()
      })

      it("should call charge card handler to charge the card", function(done) {
        //stripeChargePromise = Promise.resolve()
        findInvoicePromise = Promise.resolve(createdEmptyInvoice)
        updateInvoicePromise = Promise.resolve({ dataValues: expectedInvoice })

        invoiceService.payForInvoice(newInvoice)
          .finally(function() {
            expect(stripeHandler.chargeCard.calledWith(newInvoice.stripeToken, newInvoice.totalAmount)).to.be.true
            done()
          })
      })

      it("After charge, logger should log", function(done) {
        stripeChargePromise = Promise.resolve()
        findInvoicePromise = Promise.resolve(createdEmptyInvoice)
        updateInvoicePromise = Promise.resolve({ dataValues: expectedInvoice })

        const promise = invoiceService.payForInvoice(newInvoice)

        promise.finally(function() {
          // expect(logger.logNewChargeEvent.calledWith(newInvoice.stripeToken)).to.be.true
          // expect(logger.logNewFailedCharge).not.toHaveBeenCalled()
          done()
        })
      })

      it("update stripe reference with passed in values", function(done) {
        const invoice = {
          totalAmountInCents: 6000,
          paymentDate: moment().format("L"),
          paymentType: "stripe",
          paymentStatus: "PAID",
          transactionId: "trans_1"
        }

        stripeChargePromise = Promise.resolve({ id: "trans_1" })
        findInvoicePromise = Promise.resolve(createdEmptyInvoice)
        updateInvoicePromise = Promise.resolve({ dataValues: expectedInvoice })

        invoiceService.payForInvoice(newInvoice)
          .then((updatedInvoice) => {
            expect(updatedInvoice.dataValues.id).to.equal(expectedInvoice.id)
            expect(updatedInvoice.dataValues.reference).to.equal(expectedInvoice.reference)

            expect(Invoice.update.calledWith(invoice, { where: { id: 1 } })).to.be.true
          }).then(done)
      })

      it("If charge card fails, logger should log failed event", function(done) {
        const errorMessage = "Charge card failed with Stripe!"

        stripeChargePromise.reject(errorMessage)

        invoiceService.payForInvoice(newInvoice)
          .then(function() {
            // done.fail("payForInvoice should have failed, not succeeded, not this time.")
          })
          .catch((error) => {
            expect(error).not.to.exist
            // expect(logger.logNewFailedCharge.calledWith(newInvoice.stripeToken, errorMessage)).to.be.true
          }).then(done)
      })

      it("If charge card fails, should reject promise with charg card error", function(done) {
        stripeChargePromise.reject("Charge card failed with Stripe!")

        invoiceService.payForInvoice(newInvoice)
          .then(function() {
            // done.fail("payForInvoice should have failed, not succeeded, not this time.")
          })
          .catch((error) => {
            expect(error.name).to.equal("ChargeCardError")
            expect(error.message).to.equal("Failed to charge card!")
          }).then(done)
      })
    })

    describe("Direct debit, cheque, and no contribute payment", function() {
      it("update the exisiting invoice", function(done) {
        const invoice = {
          totalAmountInCents: 6000,
          paymentDate: moment().format("L"),
          paymentType: "deposit",
          paymentStatus: "Pending"
        }

        findInvoicePromise = Promise.resolve(createdEmptyInvoice)
        updateInvoicePromise = Promise.resolve({ dataValues: expectedInvoice })

        invoiceService.payForInvoice(newInvoice)
          .then((updatedInvoice) => {
            expect(updatedInvoice.dataValues.id).to.equal(expectedInvoice.id)
            expect(updatedInvoice.dataValues.reference).to.equal(expectedInvoice.reference)

            expect(Invoice.update.calledWith(invoice, { where: { id: 1 } })).to.be.true
          }).then(done)
      })
    })

    it("logs update invoice event", function(done) {
      const invoice = {
        totalAmountInCents: 6000,
        paymentDate: moment().format("L"),
        paymentType: "deposit",
        paymentStatus: "Pending"
      }

      findInvoicePromise = Promise.resolve(createdEmptyInvoice)
      updateInvoicePromise = Promise.resolve({ dataValues: expectedInvoice })

      invoiceService.payForInvoice(newInvoice)
        .finally(function() {
          // expect(logger.logUpdateInvoiceEvent.calledWith(1, invoice)).to.be.true
        }).then(done)
    })

    it("rejects the promise when update invoice failed, and log the error", function(done) {
      const errorMessage = "Seriously, we still don't have any damn bananas."

      findInvoicePromise = Promise.resolve(createdEmptyInvoice)
      updateInvoicePromise.reject(errorMessage)

      invoiceService.payForInvoice(newInvoice)
        .then(function() {
          // done.fail("payForInvoice should have failed, not succeeded, not this time.")
        })
        .catch((error) => {
          expect(error).to.equal(errorMessage)
        }).then(done)
    })

    it("rejects the promise when find invoice failed, and log the error", function(done) {
      findInvoicePromise = Promise.resolve({})

      invoiceService.payForInvoice(newInvoice)
        .then(function() {
          // done.fail("payForInvoice should have failed, not succeeded, not this time.")
        })
        .catch((error) => {
          expect(error.message).to.equal("Invoice not found for Id: 1")
        }).then(done)
    })
  })


  describe("paypalChargeSuccess", function() {
    it("should call the error logger when no matching invoice id in database", function(done) {
      updateInvoicePromise = Promise.resolve([0])

      invoiceService.paypalChargeSuccess(23, 1)
        .then(function() {
          // done.fail("paypalChargeSuccess should have failed, not succeeded, not this time.")
        })
        .catch((error) => {
          expect(error).not.to.exist
        }).then(done)
    })

    it("should call the error logger when no multiple matching invoice id in database", function(done) {
      updateInvoicePromise = Promise.resolve([2])

      invoiceService.paypalChargeSuccess(23, 1)
        .then(function() {
          // done.fail("paypalChargeSuccess should have failed, not succeeded, not this time.")
        })
        .catch((error) => {
          expect(error).not.to.exist
        }).then(done)
    })
  })

  describe("unconfirmedPaymentList", function() {
    let invoiceFindAllStub, unconfirmedPaymentValue, expectedOutput

    beforeEach(function() {
      invoiceFindAllStub = sinon.stub(models.Invoice, "findAll")
      unconfirmedPaymentValue = [{
        dataValues: {
          reference: "INT34",
          paymentType: "deposit",
          totalAmountInCents: "2000",
          paymentStatus: "Pending",
          member: {
            dataValues: {
              firstName: "Gotta catch em all",
              lastName: "Pokemans Pokewomans Pokepeople"
            }
          }
        }
      }]
      expectedOutput = [{
        firstName: "Gotta catch em all",
        lastName: "Pokemans Pokewomans Pokepeople",
        reference: "INT34",
        paymentType: "deposit",
        totalAmountInCents: "2000",
        paymentStatus: "Pending"
      }]
    })

    afterEach(function() {
      invoiceFindAllStub.restore()
    })

    it("Should retrieve the unconfirmed payments", function(done) {
      invoiceFindAllStub.returns(Promise.resolve(unconfirmedPaymentValue))

      const promise = invoiceService.unconfirmedPaymentList()

      promise.then((value) => {
        expect(invoiceFindAllStub.called()).to.be.true
        expect(value).to.equal(expectedOutput)
      })
      .then(done)
      .catch(done)
    })

    it("Should throw an error if findAll fails", function(done) {
      invoiceFindAllStub.returns(Promise.reject("Could not connect to database"))

      const promise = invoiceService.unconfirmedPaymentList()

      promise.then(function() {
        // done.fail("Should not go into then")
      }).catch((err) => {
        expect(err).to.equal("An error has occurred while fetching unconfirmed members")
        done()
      })
    })
  })

  describe("acceptPayment", function() {
    reference = "INT8"

    it("Should retrieve the unaccepted payments", function(done) {
      updateInvoicePromise = Promise.resolve([1])

      const promise = invoiceService.acceptPayment(reference)

      promise.then(function() {
        expect(updateInvoiceStub.called()).to.be.true
      })
      .then(done)
      .catch(done)
    })

    it("Should throw an error if update fails", function(done) {
      updateInvoicePromise.reject("This should not be shown to user")

      const promise = invoiceService.acceptPayment(reference)

      promise.then(function() {
        // done.fail("Should not go into then when promise rejected")
      }).catch((err) => {
        expect(err).to.equal("This should not be shown to user")
        done()
      })
    })

    it("Should throw an error if no rows updated", function(done) {
      reference = "INT8"
      updateInvoicePromise = Promise.resolve([0])

      const promise = invoiceService.acceptPayment(reference)

      promise.then(function() {
        // done.fail("Should not go into then when no rows updated")
      }).catch((err) => {
        expect(err).to.equal("Failed to accept INT8 in the database")
        done()
      })
    })
  })
})
