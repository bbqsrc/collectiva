import React, { Component } from "react"
import ReactDOM from "react-dom"
import MembershipType from "./MembershipType.jsx"
import Details from "./Details.jsx"
import Payment from "./Payment.jsx"
import ConfirmDetails from "./ConfirmDetails.jsx"
import ProgressBar from "./ProgressBar.jsx"
import Finished from "./Finished.jsx"
import $ from "jquery"

export default class NewMemberForm extends Component {
  constructor(props) {
    super(props)
    this.nextStep = this.nextStep.bind(this)
    this.previousStep = this.previousStep.bind(this)
    this.setMembershipType = this.setMembershipType.bind(this)
    this.submitPayment = this.submitPayment.bind(this)
    this.saveAndContinue = this.saveAndContinue.bind(this)
    this.saveMemberDetails = this.saveMemberDetails.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
    this.getForm = this.getForm.bind(this)

    const startingState = 1

    this.state = {
      errors: [],
      step: (this.props.initialState === undefined ? startingState : this.props.initialState)
    }

    this.formValues = {
      membershipType: "",
      isEnrolled: "",
      residentialStatus: "",
      isMemberOfOtherParty: "",
      eligibility: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      primaryPhoneNumber: "",
      secondaryPhoneNumber: "",
      residentialAddress: {
        address: "",
        suburb: "",
        country: "",
        state: "",
        postcode: ""
      },
      postalAddress: {
        address: "",
        suburb: "",
        country: "",
        state: "",
        postcode: ""
      }
    }
  }

  componentDidUpdate() {
    ReactDOM.findDOMNode(this).scrollIntoView()
  }

  nextStep() {
    this.setState({ step: this.state.step + 1 })
  }

  previousStep() {
    this.setState({ step: this.state.step - 1 })
  }

  setMembershipType(type) {
    this.setState({ membershipType: type })
    this.nextStep()
  }

  saveAndContinue(fieldValues) {
    this.formValues = fieldValues
    this.nextStep()
  }

  saveMemberDetails() {
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: "/members/new",
      data: JSON.stringify({
        details: this.formValues
      })
    })
    .done((res) => {
      this.formValues.id = res.id
      this.nextStep()
    })
    .fail(() => {
      this.setState({
        errors: ["Sorry, we could not register you this time. Please try again, or " +
                 "contact us at membership@pirateparty.org.au."]
      })
    })
  }

  submitPayment(payment) {
    let url

    switch (payment.paymentType) {
      case "braintree":
        url = "/payment/braintree"
        break
      case "stripe":
        url = "/payment/stripe"
        break
      case "deposit":
        url = "/payment/direct-deposit"
        break
      case "cheque":
        url = "/payment/cheque"
        break
      default:
        url = null
    }

    if (url === null) {
      this.nextStep()
      return
    }

    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: url,
      data: JSON.stringify({
        memberId: this.formValues.id,
        amount: payment.amount,
        paymentMethod: payment.paymentType,
        paymentInfo: payment.paymentInfo
      })
    })
    .done(() => this.nextStep())
    .fail(() => {
      this.setState({
        errors: ["Sorry, we could not register you this time. Please try again, or " +
                 "contact us at membership@pirateparty.org.au."]
      })
    })
  }

  getForm() {
    switch (this.state.step) {
      case 1:
        return <MembershipType nextStep={this.setMembershipType}
                               formValues={this.formValues} />
      case 2:
        return <Details formValues={this.formValues}
                        saveAndContinue={this.saveAndContinue}
                        previousStep={this.previousStep}
                        membershipType={this.state.membershipType} />
      case 3:
        return <ConfirmDetails formValues={this.formValues}
                               nextStep={this.saveMemberDetails}
                               previousStep={this.previousStep}
                               errors={this.state.errors}/>
      case 4:
        return <Payment formValues={this.formValues}
                        previousStep={this.previousStep}
                        nextStep={this.submitPayment}
                        errors={this.state.errors}
                        member={this.formValues} />
      case 5:
        return <Finished email={this.formValues.email} />
    }
  }

  render() {
    return (
      <div>
        <ProgressBar progress={this.state.step} />
        {this.getForm() }
      </div>
    )
  }
}
