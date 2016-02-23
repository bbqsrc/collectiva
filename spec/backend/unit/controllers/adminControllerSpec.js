'use strict';

const specHelper = require('../../../support/specHelper'),
    sinon = specHelper.sinon,
    Promise = specHelper.models.Sequelize.Promise,
    invoiceService = require('../../../../src/backend/services/invoiceService'),
    memberService = require('../../../../src/backend/services/memberService');

let adminController = require('../../../../src/backend/controllers/adminController');

describe('adminController', () => {
    let res,
        req;
    let jsonStub,
        memberList;

    beforeEach(() => {
        jsonStub = sinon.stub();

        res = {
            status: sinon.stub().returns({json: jsonStub})
        };

        req = {};

        memberList = [{firstName: 'bob'}];
    });

    describe('membersList', () => {
        let membersList = adminController.membersList;

        beforeEach(() => {
            sinon.stub(memberService, 'list');
        });

        afterEach(() => {
            memberService.list.restore();
        });

        it('responds with a list of members', (done) => {
            memberService.list.returns(Promise.resolve(memberList));

            membersList(req, res).finally(() => {
                expect(res.status).toHaveBeenCalled(200);
                expect(jsonStub).toHaveBeenCalledWith({members: memberList});
            }).then(done, done.fail);
        });

        it('responds with an error list of members', (done) => {
            let error = 'Liar liar pants on fire';
            memberService.list.returns(Promise.reject(error));

            membersList(req, res).finally(() => {
                expect(res.status).toHaveBeenCalled(500);
                expect(jsonStub).toHaveBeenCalledWith({error: error});
            }).then(done, done.fail);
        });
    });

    describe('unconfirmedPaymentsMembersList', () => {
        let membersList = adminController.unconfirmedPaymentsMembersList;

        beforeEach(() => {
            sinon.stub(invoiceService, 'unconfirmedPaymentList');
        });

        afterEach(() => {
            invoiceService.unconfirmedPaymentList.restore();
        });

        it('responds with a list of unconfirmed payments', (done) => {
            invoiceService.unconfirmedPaymentList.returns(Promise.resolve(memberList));

            membersList(req, res).finally(() => {
                expect(res.status).toHaveBeenCalled(200);
                expect(jsonStub).toHaveBeenCalledWith({members: memberList});
            }).then(done, done.fail);
        });

        it('responds with an error list of unconfirmed payments', (done) => {
            let error = 'Liar liar pants on fire';
            invoiceService.unconfirmedPaymentList.returns(Promise.reject(error));

            membersList(req, res).finally(() => {
                expect(res.status).toHaveBeenCalled(500);
                expect(jsonStub).toHaveBeenCalledWith({error: error});
            }).then(done, done.fail);
        });
    });
});
