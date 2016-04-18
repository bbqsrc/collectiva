import React, {Component} from 'react';
import ReactDOM from 'react-dom';

export default class Errors extends Component {
  constructor(props) {
    super(props)
    this.getClass = this.getClass.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
  }

  getClass(invalidFields) {
    return invalidFields.length >= 1 ? "validationErrors" : "hidden"
  }

  componentDidUpdate() {
    if (this.props.scrollToError) {
      ReactDOM.findDOMNode(this).scrollIntoView(false)
    }
  }

  render() {
    return (<div className={this.getClass(this.props.invalidFields)}>
      <div className="validationErrors-text">
          <span>{this.props.errorTitle}</span>
          <ul className="errors">
            {this.props.invalidFields.map((field, i) => {
              return <li key={i}>{field}</li>
            })}
          </ul>
      </div>
    </div>)
  }
}
