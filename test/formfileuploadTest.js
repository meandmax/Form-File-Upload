var FormFileUpload = require('../src/js/formfileupload.js');
var assert         = require('assert');
var sinon          = require('sinon');
var expect         = require('expect.js');
var mocha          = require('mocha');

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

var nativeFilePng = {
	name: 'Testfile.png',
	type: 'image/png',
	size: '219308'
};

var nativeFileTiff = {
	name: 'Testfile.tiff',
	type: 'image/tiff',
	size: '12ß039ß'
};

var nativeFileGif = {
	name: 'Testfile.gif',
	type: 'image/gif',
	size: '12ß039ß'
};
var nativeFileJpg = {
	name: 'Testfile.jpg',
	type: 'image/jpeg',
	size: '92838478'
};

var nativeFileXls = {
	name: 'Testfile.xls',
	type: '',
	size: '293002'
};

var optionsMock        = sinon.spy();
var fileUploadElMock   = sinon.spy();
var dropBoxElMock      = {
	addEventListener: sinon.spy()
};

describe('easyformfileupload', function() {
	var easyformfileupload = new FormFileUpload(fileUploadElMock, dropBoxElMock, optionsMock);

	describe('the public api', function(){
		it('should expose the function dndHandler', function() {
			expect(easyformfileupload.dndHandler).to.be.a('function');
			console.log(easyformfileupload);
		})
	})
})
