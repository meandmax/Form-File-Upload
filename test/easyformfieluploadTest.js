var EasyFormFileUpload = require('../src/js/easyformfileupload.js');
var assert             = require('assert');
var sinon              = require('sinon');
var expect             = require('expect.js');
var mocha              = require('mocha');

document               = sinon.spy();

var optionsMock        = sinon.spy();
var fileUploadElMock   = sinon.spy();
var dropBoxElMock      = sinon.spy();

describe('easyformfileupload', function() {
	//var easyformfileupload = new EasyFormFileUpload(fileUploadElMock, dropBoxElMock, optionsMock);

	describe('the public api', function(){
		it('should expose a function', function() {
		//	expect(easyformfileupload.dndHandler).to.be.a('function');
		})
	})
})
