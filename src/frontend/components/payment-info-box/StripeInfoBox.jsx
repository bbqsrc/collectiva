import React, { Component } from "react"

export default class StripeInfoBox extends Component {
  constructor(props) {
    super(props)
    this.render = this.render.bind(this)
  }

  render() {
    return (
      <div className="info-box payment">
        <div className="info-body">
          <strong>You will be able to enter your details after clicking continue.</strong>
        </div>
      </div>
    )
  }
}
