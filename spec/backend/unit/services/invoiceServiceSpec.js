"use strict"

const specHelper = require("../../../support/specHelper"),
      stripeHandler = require("../../../../src/backend/lib/stripeHandler"),
      models = require("../../../../src/backend/models"),
      Invoice = models.Invoice,
      moment = require("moment"),
      Promise = require("bluebird").Promise

const invoiceService = require("../../../../src/backend/services/invoiceService")

describe("invoiceService", function() {
  let createInvoiceStub,
      updateInvoiceStub,
      findInvoiceStub,
      newInvoice,
      expectedInvoice,
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
        updatedInvoice,
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
      updatedInvoice = { dataValues: expectedInvoice }
    })

    it("with member email and membershipType, then update the reference", function(done) {
      createInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
      findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
      updateInvoiceStub.returns(Promise.resolve(updatedInvoice))

      invoiceService.createEmptyInvoice(memberEmail, membershipType)
        .then((createdInvoice) => {
          expect(createdInvoice.id).to.equal(expectedInvoice.invoiceId)
        }).finally(() => done())
    })

    it("logs the create empty invoice event", function(done) {
      createInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
      findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
      updateInvoiceStub.returns(Promise.resolve(updatedInvoice))

      invoiceService.createEmptyInvoice(memberEmail, membershipType)
        .finally(function() {
          // expect(logger.logCreateEmptyInvoiceEvent.calledWith(createdEmptyInvoice)).to.be.true
          // expect(logger.logUpdateInvoiceEvent.calledWith(1, { reference: "FUL1" })).to.be.true
        }).finally(() => done())
    })

    it("logs the error when create empty invoice failed", function(done) {
      createInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
      findInvoiceStub.returns(Promise.resolve({}))

      const promise = invoiceService.createEmptyInvoice(memberEmail, membershipType)

      promise.catch((error) => {
        expect(error.message).to.equal("An error has occurred internally.")
      }).finally(() => done())
    })

    describe("reject the promise when", function() {
      it("create empty invoice failed", function(done) {
        createInvoiceStub.returns(Promise.reject(new Error("Seriously, we still don't have any damn bananas.")))

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            done(new Error("createEmptyInvoice should have failed, not succeeded, not this time."))
          })
          .catch((error) => {
            expect(error).to.exist
            done()
          })
      })

      it("find invoice failed", function(done) {
        createInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
        findInvoiceStub.returns(Promise.reject(new Error("Seriously, we still don't have any damn bananas.")))

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            done(new Error("createEmptyInvoice should have failed, not succeeded, not this time."))
          })
          .catch((error) => {
            expect(error).to.exist
            done()
          })
      })

      it("invoice not found", function(done) {
        createInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
        findInvoiceStub.returns(Promise.resolve({}))

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            done(new Error("createEmptyInvoice should have failed, not succeeded, not this time."))
          })
          .catch((error) => {
            expect(error).to.exist
            done()
          })
      })

      it("update invoice failed", function(done) {
        const errorMessage = "Seriously, we still don't have any damn bananas."

        createInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
        findInvoiceStub.returns(Promise.resolve(invoiceId))
        updateInvoiceStub.returns(Promise.reject(new Error(errorMessage)))

        invoiceService.createEmptyInvoice(memberEmail, membershipType)
          .then(function() {
            done(new Error("createEmptyInvoice should have failed, not succeeded, not this time."))
          })
          .catch((error) => {
            expect(error).to.exist
            done()
          })
      })
    })
  })

  describe("pay for invoice", function() {
    // TODO: fix this, the charge stub is faulty without stripe config
    describe.skip("Credit Card/Debit Card Payment", function() {
      let stripeChargeStub,
          stripeToken, totalAmount

      beforeEach(function() {
        newInvoice.paymentType = "stripe"
        newInvoice.paymentStatus = "PAID"
        newInvoice.transactionId = "trans_1"
        newInvoice.stripeToken = "token"

        stripeToken = "47"
        totalAmount = 123

        stripeChargeStub = sinon.stub(stripeHandler, "chargeCard")
      })

      afterEach(function() {
        stripeHandler.chargeCard.restore()
      })

      it("should call charge card handler to charge the card", function(done) {
        stripeChargeStub.returns(Promise.resolve())
        findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
        updateInvoiceStub.returns(Promise.resolve({ dataValues: expectedInvoice }))

        invoiceService.payForInvoice(newInvoice)
          .then(function() {
            expect(stripeHandler.chargeCard.calledWith(newInvoice.stripeToken, newInvoice.totalAmount)).to.be.true
            done()
          })
          .catch(done)
      })

      it("After charge, logger should log", function(done) {
        stripeChargeStub.returns(Promise.resolve())
        findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
        updateInvoiceStub.returns(Promise.resolve({ dataValues: expectedInvoice }))

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

        stripeChargeStub.returns(Promise.resolve({ id: "trans_1" }))
        findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
        updateInvoiceStub.returns(Promise.resolve({ dataValues: expectedInvoice }))

        invoiceService.payForInvoice(newInvoice)
          .then((updatedInvoice) => {
            expect(updatedInvoice.dataValues.id).to.equal(expectedInvoice.id)
            expect(updatedInvoice.dataValues.reference).to.equal(expectedInvoice.reference)

            expect(Invoice.update.calledWith(invoice, { where: { id: 1 } })).to.be.true
          }).finally(() => done())
      })

      it("If charge card fails, logger should log failed event", function(done) {
        const errorMessage = "Charge card failed with Stripe!"

        stripeChargeStub.returns(Promise.reject(new Error(errorMessage)))

        invoiceService.payForInvoice(newInvoice)
          .then(function() {
            done(new Error("payForInvoice should have failed, not succeeded, not this time."))
          })
          .catch((error) => {
            expect(error).to.exist
            done()
            // expect(logger.logNewFailedCharge.calledWith(newInvoice.stripeToken, errorMessage)).to.be.true
          })
      })

      it("If charge card fails, should reject promise with charg card error", function(done) {
        stripeChargeStub.returns(Promise.reject(new Error("Charge card failed with Stripe!")))

        invoiceService.payForInvoice(newInvoice)
          .then(function() {
            done(new Error("payForInvoice should have failed, not succeeded, not this time."))
          })
          .catch((error) => {
            expect(error.name).to.equal("ChargeCardError")
            expect(error.message).to.equal("Failed to charge card!")
          }).finally(() => done())
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

        findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
        updateInvoiceStub.returns(Promise.resolve({ dataValues: expectedInvoice }))

        invoiceService.payForInvoice(newInvoice)
          .then((updatedInvoice) => {
            expect(updatedInvoice.dataValues.id).to.equal(expectedInvoice.id)
            expect(updatedInvoice.dataValues.reference).to.equal(expectedInvoice.reference)

            expect(Invoice.update.calledWith(invoice, { where: { id: 1 } })).to.be.true
          }).finally(() => done())
      })
    })

    it("logs update invoice event", function(done) {
      const invoice = {
        totalAmountInCents: 6000,
        paymentDate: moment().format("L"),
        paymentType: "deposit",
        paymentStatus: "Pending"
      }

      findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
      updateInvoiceStub.returns(Promise.resolve({ dataValues: expectedInvoice }))

      invoiceService.payForInvoice(newInvoice)
        .catch(done)
        .finally(() => done())
    })

    it("rejects the promise when update invoice failed, and log the error", function(done) {
      const errorMessage = "Seriously, we still don't have any damn bananas."

      findInvoiceStub.returns(Promise.resolve(createdEmptyInvoice))
      updateInvoiceStub.returns(Promise.reject(new Error(errorMessage)))

      invoiceService.payForInvoice(newInvoice)
        .then(function() {
          done(new Error("payForInvoice should have failed, not succeeded, not this time."))
        })
        .catch((error) => {
          expect(error.message).to.equal(errorMessage)
        }).finally(() => done())
    })

    it("rejects the promise when find invoice failed, and log the error", function(done) {
      findInvoiceStub.returns(Promise.resolve({}))

      invoiceService.payForInvoice(newInvoice)
        .then(function() {
          done(new Error("payForInvoice should have failed, not succeeded, not this time."))
        })
        .catch((error) => {
          expect(error.message).to.equal("Invoice not found for Id: 1")
        }).finally(() => done())
    })
  })


  describe("paypalChargeSuccess", function() {
    it("should call the error logger when no matching invoice id in database", function(done) {
      updateInvoiceStub.returns(Promise.resolve([0]))

      invoiceService.paypalChargeSuccess(23, 1)
        .then(function() {
          done(new Error("paypalChargeSuccess should have failed, not succeeded, not this time."))
        })
        .catch((error) => {
          expect(error).to.exist
        }).finally(() => done())
    })

    it("should call the error logger when no multiple matching invoice id in database", function(done) {
      updateInvoiceStub.returns(Promise.resolve([2]))

      invoiceService.paypalChargeSuccess(23, 1)
        .then(function() {
          done(new Error("paypalChargeSuccess should have failed, not succeeded, not this time."))
        })
        .catch((error) => {
          expect(error).to.exist
        }).finally(() => done())
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
        expect(invoiceFindAllStub).to.have.been.called
        expect(value).to.deep.equal(expectedOutput)
      })
      .finally(() => done())
      .catch(done)
    })

    it("Should throw an error if findAll fails", function(done) {
      invoiceFindAllStub.returns(Promise.reject(new Error("Could not connect to database")))

      const promise = invoiceService.unconfirmedPaymentList()

      promise.then(function() {
        done(new Error("Should not go into then"))
      }).catch((err) => {
        expect(err.message).to.equal("An error has occurred while fetching unconfirmed members")
        done()
      })
    })
  })

  describe("acceptPayment", function() {
    reference = "INT8"

    it("Should retrieve the unaccepted payments", function(done) {
      updateInvoiceStub.returns(Promise.resolve([1]))

      invoiceService.acceptPayment(reference)
      .then(function() {
        expect(updateInvoiceStub).to.have.been.called
        done()
      })
      .catch(done)
    })

    it("Should throw an error if update fails", function(done) {
      updateInvoiceStub.returns(Promise.reject(new Error("This should not be shown to user")))

      invoiceService.acceptPayment(reference)
      .then(function() {
        done(new Error("Should not go into then when promise rejected"))
      })
      .catch((err) => {
        expect(err.message).to.equal("This should not be shown to user")
        done()
      })
    })

    it("Should throw an error if no rows updated", function(done) {
      reference = "INT8"
      updateInvoiceStub.returns(Promise.resolve([0]))

      const promise = invoiceService.acceptPayment(reference)

      promise.then(function() {
        done(new Error("Should not go into then when no rows updated"))
      }).catch((err) => {
        expect(err.message).to.equal("Failed to accept payment: 'INT8'")
        done()
      })
    })
  })
})
