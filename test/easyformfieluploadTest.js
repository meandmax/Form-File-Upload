var EasyFormFileUpload = require('../src/js/easyformfileupload.js');
var assert             = require('assert');
var sinon              = require('sinon');
var expect             = require('expect.js');
var mocha              = require('mocha');

global.document = {
	querySelector: sinon.spy(),
	createElement: sinon.spy(),
	querySelectorAll: sinon.spy()
};

global.window = {
	File: true,
	FileReader: true,
	FileList: true
}

var optionsMock        = sinon.spy();
var fileUploadElMock   = sinon.spy();
var dropBoxElMock      = {
	addEventListener: sinon.spy()
};

describe('easyformfileupload', function() {
	var easyformfileupload = new EasyFormFileUpload(fileUploadElMock, dropBoxElMock, optionsMock);

	describe('the public api', function(){
		it('should expose the function dndHandler', function() {
			expect(easyformfileupload.dndHandler).to.be.a('function');
		})
	})
})
