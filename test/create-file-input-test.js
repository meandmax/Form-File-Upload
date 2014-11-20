var createFileInput = require('../src/js/utils/create-file-input.js');
var assert = require('assert');
var sinon  = require('sinon');
var expect = require('expect.js');
var mocha  = require('mocha');

global.document = {
    createElement: sinon.stub().returns({type: '', className: '', name: ''})
};

describe('Create File Input Element', function () {
    var id = 0;

    before('calls createFileInput', function () {
        createFileInput(id);
    });

    it('calls document.createElement once', function () {
        assert(document.createElement.calledOnce);
    });

    it('increments the the fileInputId by 1', function () {
        expect(id, 1);
    });

});
