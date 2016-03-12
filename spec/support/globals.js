"use strict"

const chai = require("chai")
const sinon = require("sinon")
const Promise = require("bluebird").Promise

chai.use(require("chai-as-promised"))
chai.use(require("sinon-chai"))

require("co-mocha")

const expect = chai.expect

Object.assign(global, { chai, sinon, expect, Promise })
