"use strict"

const Q = require("q"),
      models = require("../models"),
      logger = require("../lib/logger"),
      stripeHandler = require("../lib/stripeHandler"),
      ChargeCardError = require("../errors/ChargeCardError"),
      moment = require("moment"),
      _ = require("lodash"),
      Invoice = models.Invoice,
      Member = models.Member

function findInvoice(invoiceId) {
  return Q(Invoice.findOne({ where: { id: invoiceId } }))
    .then((result) => {
      if (_.isEmpty(result)) {
        throw new Error(`Invoice not found for Id: ${invoiceId}`)
      }
      return result.dataValues.id
    })
}

function updateInvoice(updateFields) {
  return invoiceId => {
    return Invoice.update(updateFields, { where: { id: invoiceId } })
  }
}

function updateInvoiceReference(membershipType) {
  return data => {
    const invoiceId = data.dataValues.id
    const updateFields = {
      reference: membershipType.substring(0, 3).toUpperCase() + invoiceId
    }

    return findInvoice(invoiceId)
      .then(updateInvoice(updateFields))
      .tap(() => {
        logger.debug("update-invoice", "Invoice updated", {
          id: invoiceId,
          fields: updateFields
        })
      })
      .then(() => {
        return { id: invoiceId }
      })
  }
}

function handleError(error) {
  throw new Error("An error has occurred internally.")
}

function createEmptyInvoice(memberEmail, membershipType) {
  const member = { email: memberEmail, type: membershipType }

  return Q({
    memberEmail,
    totalAmountInCents: 0,
    paymentDate: moment().format("L"),
    paymentType: "",
    reference: ""
  })
  .then(Invoice.create.bind(Invoice))
  .tap((invoice) => logger.debug("create-invoice", "Invoice created", { member, invoice }))
  .then(updateInvoiceReference(membershipType))
  .catch((error) => {
    logger.error("create-invoice",
      "An error occurred creating an invoice",
      { member, error }
    )
    handleError(error)
  })
}

function chargeCard(stripeToken, totalAmount) {
  return stripeHandler.chargeCard(stripeToken, totalAmount)
    .tap(() => {
      logger.debug("payment-processor:stripe",
        `Charged card with token: ${stripeToken}`,
        { token: stripeToken, amount: totalAmount }
      )
    })
    .catch((error) => {
      logger.error("payment-processor:stripe",
        `An error occurred while attempting to charge card with token: ${stripeToken}`,
        { error, token: stripeToken, amount: totalAmount }
      )
      throw new ChargeCardError("Failed to charge card!")
    })
}

function updatePaymentForInvoice(invoice) {
  const updateFields = {
    totalAmountInCents: invoice.totalAmount * 100,
    paymentDate: moment().format("L"),
    paymentType: invoice.paymentType,
    paymentStatus: invoice.paymentStatus || "Pending"
  }

  if (invoice.paymentType === "stripe") {
    updateFields.transactionId = invoice.transactionId
  }

  return findInvoice(invoice.invoiceId)
        .then(updateInvoice(updateFields))
        .tap(() => {
          logger.debug("update-invoice", "Invoice updated", {
            id: invoice.invoiceId,
            fields: updateFields
          })
        })
}

function updateStripePaymentForInvoice(invoice) {
  return (charge) => {
    invoice.paymentStatus = "PAID"
    invoice.transactionId = charge.id
    return updatePaymentForInvoice(invoice)
  }
}

function payForInvoice(invoice) {
  if (invoice.paymentType === "stripe") {
    return (
      chargeCard(invoice.stripeToken, invoice.totalAmount)
        .then(updateStripePaymentForInvoice(invoice))
    )
  } else {
    return updatePaymentForInvoice(invoice)
  }
}

function paypalChargeSuccess(customInvoiceId, paypalId) {
  function checkResultOfUpdate(value) {
    if (!value || value[0] !== 1) {
      logger.debug("payment-processor:paypal", "Failed to update transaction", {
        invoiceId: customInvoiceId, id: paypalId
      })
      return Q.reject(`Failed to update ${customInvoiceId} in the database`)
    }
  }

  return models.sequelize.transaction(t => {
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
  }).catch((err) => {
    return Q.reject(err)
  })
}

function transformMemberWithInvoice(invoice) {
  const newInvoiceRoot = invoice.dataValues
  const newMemberRoot = invoice.dataValues.member.dataValues

  delete newInvoiceRoot.member
  return Object.assign({}, newMemberRoot, newInvoiceRoot)
}

function transformMembersWithInvoice(adapter) {
  return (memberQueryResult) => {
    return memberQueryResult.map(adapter)
  }
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

  return Invoice.findAll(query)
    .then(transformMembersWithInvoice(transformMemberWithInvoice))
    .catch((error) => {
      const msg = "An error has occurred while fetching unconfirmed members"

      logger.error("invoice-service", msg, { query, error })
      return models.Sequelize.Promise.reject(msg)
    })
}

function acceptPayment(reference) {
  function checkResultOfUpdate(value) {
    if (!value || value[0] !== 1) {
      const msg = `Failed to accept payment: '${reference}'`

      logger.error("accept-payment", msg, { reference })
      return Q.reject(msg)
    }
  }

  return models.sequelize.transaction(t => {
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
  }).catch((err) => {
    return Q.reject(err)
  })
}

module.exports = {
  payForInvoice,
  createEmptyInvoice,
  paypalChargeSuccess,
  unconfirmedPaymentList,
  acceptPayment
}
