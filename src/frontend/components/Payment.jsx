import React, { Component } from "react"
import Errors from "./Errors.jsx"
import Button from "./Button.jsx"
import PaymentInfo from "./payment-info-box/PaymentInfo.jsx"
import $ from "jquery"
import _ from "lodash"

export default class Payment extends Component {
  constructor(props) {
    super(props)

    this.handleAmountChanged = this.handleAmountChanged.bind(this)
    this.handlePaymentTypeChanged = this.handlePaymentTypeChanged.bind(this)
    this.handleValidationErrors = this.handleValidationErrors.bind(this)
    this.updateErrorMessage = this.updateErrorMessage.bind(this)
    this.isValidationError = this.isValidationError.bind(this)
    this.validationErrorClass = this.validationErrorClass.bind(this)
    this.state = { amount: "50", invalidFields: [], errorMessages: [],
        paymentType: "", scrollToError: true, continueButtonDisabled: false }
  }

  componentWillReceiveProps(props) {
    this.setState({ errorMessages: props.errors,
                    errorTitle: props.errors ? "Error:" : "" })
  }

  handleValidationErrors(errorFields, scrollToError) {
    let invalidFields = errorFields
    const errors = []

    const errorMessages = {
      totalAmount: "If you wish to contribute, the minimum is $1.",
      paymentType: "Please select a payment method."
    }

    if (_.indexOf(invalidFields, "paymentType") > -1) {
      invalidFields = ["paymentType"]
    }

    _.forEach(invalidFields, function(error) {
      errors.push(errorMessages[error] || error)
    })

    this.setState({ errorMessages: errors, invalidFields, scrollToError })
  }

  updateErrorMessage(errorMessages) {
    this.setState({ errorMessages: [errorMessages] })
  }

  isValidationError(fieldName) {
    return _.indexOf(this.state.invalidFields, fieldName) > -1
  }

  validationErrorClass(fieldName) {
    if (this.isValidationError(fieldName)) {
      return "invalid contribution-amount"
    }
    return "contribution-amount"
  }

  handleAmountChanged(event) {
    this.setState({ amount: event.target.value, invalidFields: [] })
  }

  handlePaymentTypeChanged(event) {
    this.handleValidationErrors(_.pull(this.state.invalidFields, "paymentType"), false)
    this.setState({ paymentType: event.target.value })
    this.setState({ continueButtonDisabled: false })
  }

  render() {
    return (<fieldset>
      <h1 className="form-title">Pay What You Want</h1>
      <div className="form-body">
          <Errors invalidFields={this.state.errorMessages}
                  scrollToError={this.state.scrollToError}
                  errorTitle="Please check the following fields:"/>
          <div className="reminder">
              <img src="/images/reminder.svg"/>
              <div className="reminder-text">
                  The cost of membership of Pirate Party Australia is currently <b>whatever you want</b>!
              </div>
          </div>
          <div className="heading">
              <h2 className="sub-title">How would you like to contribute?</h2>
               <div className="sub-description">Choose from the options below.</div>
          </div>
          <div className="field-group" id="payments">
              <label>
                  <input type="radio" name="paymentType" value="deposit" onChange={this.handlePaymentTypeChanged}/>Direct Deposit
              </label>
              <label>
                  <input type="radio" name="paymentType" value="cheque" onChange={this.handlePaymentTypeChanged}/>Cheque
              </label>
              <label>
                  <input type="radio" name="paymentType" value="noContribute" onChange={this.handlePaymentTypeChanged}/>I do not want to contribute.
              </label>
          </div>
          <PaymentInfo paymentType={this.state.paymentType}/>
          <div className={(() => {
            return this.state.paymentType==="" || this.state.paymentType==="noContribute" ? "hidden" : "" })()
          }>
              <div className="heading">
                <h2 className="sub-title">Membership Contribution</h2>
                <div className="sub-description">Please enter an amount.</div>
              </div>
              <div className={this.validationErrorClass("totalAmount")}>
                <label>$ <small>(Australian dollars)</small>
                  <input type="text" defaultValue="50" name="totalAmount" id="totalAmount" onChange={this.handleAmountChanged}/>
                </label>
              </div>
          </div>
          <div className="navigation">
            <Button type="button" disabled={this.state.continueButtonDisabled} id="payment-continue-button"
                    onClick={this.props.nextStep} textContent="Continue" />
          </div>
      </div>
    </fieldset>)
  }
}
