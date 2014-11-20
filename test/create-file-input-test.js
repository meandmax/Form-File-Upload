'use strict';

var createFileInput = require('../src/js/utils/create-file-input.js');
var assert = require('assert');
var sinon  = require('sinon');
var expect = require('expect.js');

global.document = {
    createElement: sinon.stub().returns({
        type: '',
        className: '',
        name: ''
    })
};

describe('create file input element', function () {
    var id        = 0;
    var fileInput = createFileInput(id);

    it('calls document.createElement once', function () {
        assert(document.createElement.calledOnce);
    });

    it('type has to be set to file', function () {
        expect(fileInput.type, 'file');
    });

    it('className has to be set to fileinput', function () {
        expect(fileInput.className, 'fileinput');
    });

    it('name has to be set to fileinput-1', function () {
        expect(fileInput.name, 'fileinput-' + id);
    });

    it('increments the the fileInputId by 1', function () {
        expect(id, 1);
    });
});
