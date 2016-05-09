import React, { Component } from "react"
import $ from "jquery"
import { DropIn } from "braintree-react"
import * as braintree from "braintree-web"

export default class BraintreeInfoBox extends Component {
  constructor(props) {
    super(props)
    this.state = { token: null, error: null }

    this.render = this.render.bind(this)
    this.getToken = this.getToken.bind(this)
    this.onError = this.onError.bind(this)
    this.nonceReceived = this.nonceReceived.bind(this)

    this.getToken()
  }

  getToken() {
    $.ajax({
      type: "GET",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: "/payment/braintree"
    })
    .done((res) => this.setState({ token: res.token }))
    .fail((error) => {
      console.warn("failed to get braintree client token", error)
      this.setState({ error: "Sorry, could not initilize braintree client token. Please try again later." })
    })
  }

  onError(err) {
    this.setState({
      error: "There was a problem with the Braintree widget. Please try again later."
    })
  }

  /**
   * cf. <https://developers.braintreepayments.com/reference/client-reference/javascript/v2/configuration#setup-method-options>
   *
   * @param {{nonce: string, type: string, details: Object}} nonce
   */
  nonceReceived(nonce) {
    this.props.didUpdate(nonce)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="info-box payment">
            <div>Sorry, there was problem.</div>
            <div>{this.state.error}</div>
        </div>
      )
    }

    if (this.state.token) {
      return (
        <div className="info-box payment" style={{ padding: 15 }}>
          <DropIn braintree={braintree} clientToken={this.state.token}
                  onError={this.onError}
                  onPaymentMethodReceived={this.nonceReceived} />
        </div>
      )
    }

    return (
      <div className="info-box payment">
        Initilizing braintree widget…
      </div>
    )
  }
}
