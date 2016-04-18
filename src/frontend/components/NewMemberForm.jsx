import React, {Component} from 'react'
import ReactDOM from 'react-dom'
import MembershipType from './MembershipType.jsx'
import Details from './Details.jsx'
import Payment from './Payment.jsx'
import ConfirmDetails from './ConfirmDetails.jsx'
import ProgressBar from './ProgressBar.jsx'
import Finished from './Finished.jsx'
import $ from 'jquery'

export default class NewMemberForm extends Component {
    constructor(props) {
        super(props)
        this.nextStep = this.nextStep.bind(this)
        this.previousStep = this.previousStep.bind(this)
        this.setMembershipType = this.setMembershipType.bind(this)
        this.postAndContinue = this.postAndContinue.bind(this)
        this.saveAndContinue = this.saveAndContinue.bind(this)
        this.componentDidUpdate = this.componentDidUpdate.bind(this)
        this.getForm = this.getForm.bind(this)

        let startingState = 1
        this.state = { errors: [],
                       step: (this.props.initialState === undefined ? startingState : this.props.initialState) }
        this.formValues = {
                            membershipType: '',
                            isEnrolled: '',
                            residentialStatus: '',
                            isMemberOfOtherParty: '',
                            eligibility: '',
                            firstName: '',
                            lastName: '',
                            dateOfBirth: '',
                            gender: '',
                            email: '',
                            primaryPhoneNumber: '',
                            secondaryPhoneNumber: '',
                            residentialAddress: {
                                address: '',
                                suburb: '',
                                country: '',
                                state: '',
                                postcode: ''
                            },
                            postalAddress: {
                                address: '',
                                suburb: '',
                                country: '',
                                state: '',
                                postcode: ''
                            }
                        }
    }

    componentDidUpdate() {
        ReactDOM.findDOMNode(this).scrollIntoView()
    }

    nextStep() {
        this.setState( { step: this.state.step + 1  } )
    }

    previousStep() {
        this.setState( { step: this.state.step - 1  } )
    }

    setMembershipType(type) {
      this.setState({membershipType: type})
      this.nextStep()
    }

    saveAndContinue(fieldValues) {
      this.formValues = fieldValues
      this.nextStep()
    }

    postAndContinue(payment) {
      const self = this

      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: "/members/new",
        data: {
          details: this.formValues,
          payment
        }
      })
      .done(function() { self.nextStep() })
      .fail(function() {
        self.setState({
          errors: ['Sorry, we could not register you this time. Please try again, or ' +
                   'contact us at membership@pirateparty.org.au.']
        })
      })
    }

    getForm() {
      switch(this.state.step) {
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
                                    nextStep={this.nextStep}
                                    previousStep={this.previousStep}
                                    errors={this.state.errors}/>
          case 4:
              return <Payment formValues={this.formValues}
                              previousStep={this.previousStep}
                              nextStep={this.postAndContinue}
                              errors={this.state.errors} />
          case 5:
              return <Finished email={this.formValues.email} />
      }
    }

    render() {
        return (
          <div>
            <ProgressBar progress={this.state.step} />
            {this.getForm()}
          </div>
        )
    }
}
