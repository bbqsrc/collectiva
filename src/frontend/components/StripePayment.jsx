import React, { Component } from "react"

import StripeCheckout from "react-stripe-checkout"

export default class StripePayment extends Component {
  constructor(props) {
    super(props)

    this.render = this.render.bind(this)
  }

  render() {
    return (
      <StripeCheckout
        token={(token) => this.props.didUpdate(token)}
        email={this.props.member.email}
        stripeKey="pk_test_zzlAcDog2DyKZBFfohRxE1N3"
        currency="AUD"
        />
    )
  }
}
