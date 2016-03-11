"use strict" /* eslint-disable prefer-const */

const invoiceService = require("../../../../src/backend/services/invoiceService"),
      paymentValidator = require("../../../../src/lib/paymentValidator"),
      ChargeCardError = require("../../../../src/backend/errors/ChargeCardError"),
      Promise = require("bluebird").Promise

const invoicesController = require("../../../../src/backend/controllers/invoicesController")

describe("invoicesController", function() {
  let res,
      responseJsonStub

  beforeEach(function() {
    const renderStub = sinon.stub()
    const statusStub = sinon.stub()
    const renderLocationStub = sinon.stub()

    responseJsonStub = sinon.stub()

    statusStub.returns({
      render: renderLocationStub,
      json: responseJsonStub
    })

    res = {
      status: statusStub,
      render: renderStub
    }
  })

  describe("updateInvoiceHandler", function() {
    let payForInvoiceStub,
        validatePaymentStub

    function generateGoodRequest() {
      return {
        body: {
          memberEmail: "sherlock@holmes.co.uk",
          totalAmount: 60.1,
          paymentType: "stripe",
          stripeToken: "token",
          invoiceId: 1
        }
      }
    }

    const expectedInvoiceValues = {
      totalAmount: 60.1,
      paymentType: "stripe",
      stripeToken: "token",
      invoiceId: 1
    }

    beforeEach(function() {
      payForInvoiceStub = sinon.stub(invoiceService, "payForInvoice")
      validatePaymentStub = sinon.stub(paymentValidator, "isValid")

      payForInvoiceStub
        .withArgs(expectedInvoiceValues)
        .returns(Promise.resolve())
    })

    afterEach(function() {
      invoiceService.payForInvoice.restore()
      paymentValidator.isValid.restore()
    })

    describe("when it receives a good request", function() {
      it("responds with success", function*() {
        validatePaymentStub.returns([])

        yield invoicesController.updateInvoiceHandler(generateGoodRequest(), res)
        expect(res.status).to.have.been.calledWith(200)
      })
    })

    describe("when validation fails", function() {
      it("responds with status 400", function*() {
        validatePaymentStub.returns(["totalAmount"])

        try {
          yield invoicesController.updateInvoiceHandler(generateGoodRequest(), res)
          // TODO see if this is needed
          expect("this should not be reached").to.be.false
        } catch (error) {
          expect(error).to.exist
          expect(invoiceService.payForInvoice).not.to.have.been.called
          expect(res.status).to.have.been.calledWith(400)
        }
      })
    })

    describe("when pay for invoice fails", function() {
      it("responds with a server error", function*() {
        const errorMessage = "Seriously, we still don't have any damn bananas."

        validatePaymentStub.returns([])
        payForInvoiceStub.returns(Promise.reject(new Error(errorMessage)))

        yield invoicesController.updateInvoiceHandler(generateGoodRequest(), res)
        expect(res.status).to.have.been.calledWith(500)
        expect(responseJsonStub).to.have.been.calledWith({
          errors: "An error has occurred internally."
        })
      })

      it("responds with a bad request if charge card failed", function*() {
        validatePaymentStub.returns([])

        const errorMessage = "Seriously, we still don't have any damn bananas."
        const error = new ChargeCardError(errorMessage)

        payForInvoiceStub.returns(Promise.reject(new Error(error)))

        yield invoicesController.updateInvoiceHandler(generateGoodRequest(), res)
        expect(res.status).to.have.been.calledWith(400)
        expect(responseJsonStub).to.have.been.calledWith({ errors: errorMessage })
      })
    })
  })

  describe("acceptPayment", function() {
    const reference = "ful81"

    let req,
        acceptInvoiceStub

    beforeEach(function() {
      acceptInvoiceStub = sinon.stub(invoiceService, "acceptPayment")
      acceptInvoiceStub.returns(Promise.resolve())
      req = { params: { reference } }
    })

    afterEach(function() {
      acceptInvoiceStub.restore()
    })

    it("Should retrieve the unaccepted payments", function*() {
      yield invoicesController.acceptPayment(req, res)
      expect(acceptInvoiceStub).to.have.been.called
    })

    it("Should throw an", function*() {
      acceptInvoiceStub.returns(Promise.reject())

      try {
        yield invoicesController.acceptPayment(req, res)
      } catch (error) {
        expect(res.status).to.have.been.calledWith(500)
        expect(responseJsonStub).to.have.been.calledWith({
          errors: "Payment could not be accepted"
        })
      }
    })
  })
})
