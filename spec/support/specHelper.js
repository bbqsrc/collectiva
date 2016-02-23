'use strict';

let reporters = require('jasmine-reporters');
const sinon = require('sinon');
const Q = require('q');
require('jasmine-sinon');

var logger = require('../../src/backend/lib/logger');
var ChargeCardError = require('../../src/backend/errors/ChargeCardError');

var models = require('../../src/backend/models'),
    Address = models.Address,
    Member = models.Member,
    Invoice = models.Invoice,
    AdminUser = models.AdminUser;

var terminalReporter = new reporters.TerminalReporter({
    verbosity: 1,
    color: true,
    showStack: true
});
jasmine.getEnv().addReporter(terminalReporter);

beforeEach((done) => {
    Invoice.truncate({cascade: true}).then(() => {
        return Address.truncate({cascade: true});
    }).then(() => {
        return Member.truncate({cascade: true});
    }).then(() => {
        return AdminUser.truncate();
    }).nodeify(done);
});

module.exports = {
    sinon: sinon,
    models: models,
    Q: Q,
    logger: logger,
    ChargeCardError: ChargeCardError
};
