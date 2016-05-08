import React, { Component } from "react"
import ReactDOM from "react-dom"
import PaypalInfoBox from "./PaypalInfoBox.jsx"
import BraintreeInfoBox from "./BraintreeInfoBox.jsx"
import StripeInfoBox from "./StripeInfoBox.jsx"
import DirectDebitInfoBox from "./DirectDebitInfoBox.jsx"
import ChequeInfoBox from "./ChequeInfoBox.jsx"

export default class PaymentInfo extends Component {
  constructor(props) {
    super(props)
    this.render = this.render.bind(this)
  }

  render() {
    if (this.props.paymentType === "paypal") {
      return <PaypalInfoBox
        didUpdate={this.props.paymentInfoReceived}/>
    }
    if (this.props.paymentType === "braintree") {
      return <BraintreeInfoBox
        didUpdate={this.props.paymentInfoReceived}/>
    }
    // if (this.props.paymentType === "stripe") {
    //   return <StripeInfoBox
    //     didUpdate={this.props.paymentInfoReceived}
    //     member={this.props.member}/>
    // }
    if (this.props.paymentType === "deposit") {
      return <DirectDebitInfoBox
        didUpdate={this.props.paymentInfoReceived}/>
    }
    if (this.props.paymentType === "cheque") {
      return <ChequeInfoBox
        didUpdate={this.props.paymentInfoReceived}/>
    }

    return null
  }
}
