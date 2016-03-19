"use strict"

const Promise = require("bluebird").Promise,
      models = require("../models"),
      logger = require("../lib/logger"),
      stripeHandler = require("../lib/stripeHandler"),
      moment = require("moment"),
      Invoice = models.Invoice,
      Member = models.Member,
      sequelize = models.sequelize,
      co = require("co")

function createEmptyInvoice(memberEmail, membershipType) {
  const member = { email: memberEmail, type: membershipType }

  return co(function* () {
    try {
      const invoice = yield Invoice.create({
        memberEmail,
        totalAmountInCents: 0,
        paymentDate: moment().format("L"),
        paymentType: "",
        reference: ""
      })

      // TODO: replace with a virtual...
      invoice.reference = membershipType.substring(0, 3).toUpperCase() + invoice.id
      yield invoice.save()

      logger.debug("create-invoice", "Invoice created", { member, invoice })

      return { id: invoice.id }
    } catch (error) {
      logger.error("create-invoice",
        "An error occurred creating an invoice",
        { member, error }
      )
    }
  })
}

function* chargeCard(stripeToken, totalAmount) {
  try {
    yield stripeHandler.chargeCard(stripeToken, totalAmount)

    logger.debug("payment-processor:stripe",
      `Charged card with token: ${stripeToken}`,
      { token: stripeToken, amount: totalAmount }
    )
  } catch (error) {
    logger.error("payment-processor:stripe",
      `An error occurred while attempting to charge card with token: ${stripeToken}`,
      { error, token: stripeToken, amount: totalAmount }
    )
    throw new Error("Failed to charge card!")
  }
}

// TODO: make function properly generic for processors
// TODO: also this whole function is a massive what the fuck
function payForInvoice(invoice) {
  return co(function* () {
    Object.assign(invoice, {
      totalAmountInCents: invoice.totalAmount * 100,
      // TODO: wtf?
      paymentDate: moment().format("L"),
      paymentType: invoice.paymentType,
      paymentStatus: invoice.paymentStatus || "Pending"
    })

    if (invoice.paymentType === "stripe") {
      const charge = yield chargeCard(invoice.stripeToken, invoice.totalAmount)

      invoice.paymentStatus = "PAID"
      invoice.transactionId = charge.id
    }

    yield invoice.save()
  })
}

function paypalChargeSuccess(customInvoiceId, paypalId) {
  function checkResultOfUpdate(value) {
    if (!value || value[0] !== 1) {
      logger.debug("payment-processor:paypal", "Failed to update transaction", {
        invoiceId: customInvoiceId, id: paypalId
      })
      return Promise.reject(new Error(`Failed to update ${customInvoiceId} in the database`))
    }
  }

  return sequelize.transaction(t => {
    return Invoice.update({
      transactionId: paypalId,
      paymentStatus: "PAID"
    }, {
      where: { id: customInvoiceId }
    }, { transaction: t })
    .tap(() => {
      logger.debug("payment-processor:paypal", "Updating transaction", {
        invoiceId: customInvoiceId, id: paypalId
      })
    })
    .then(checkResultOfUpdate)
  })
}

function unconfirmedPaymentList() {
  const query = {
    include: [{
      model: Member,
      as: "member",
      attributes: [
        "firstName",
        "lastName"
      ]
    }],
    attributes: ["reference", "paymentType", "totalAmountInCents", "paymentStatus"],
    where: {
      paymentStatus: "Pending",
      paymentType: ["cheque", "deposit"]
    }
  }

  // TODO: this used to smear invoices and members into a sickening join
  // The UI will have to be refactored to handle this
  return Invoice.findAll(query)
}

function acceptPayment(reference) {
  function checkResultOfUpdate(value) {
    if (!value || value[0] !== 1) {
      const msg = `Failed to accept payment: '${reference}'`

      logger.error("accept-payment", msg, { reference })
      return Promise.reject(new Error(msg))
    }
  }

  return sequelize.transaction(t => {
    return Invoice.update({
      paymentStatus: "PAID"
    }, {
      where: { reference }
    }, { transaction: t })
    .tap(() => {
      logger.debug("update-invoice-status",
        `Updating invoice with reference: ${reference}`,
        { reference }
      )
    })
    .then(checkResultOfUpdate)
  })
}

module.exports = {
  payForInvoice,
  createEmptyInvoice,
  paypalChargeSuccess,
  unconfirmedPaymentList,
  acceptPayment
}
