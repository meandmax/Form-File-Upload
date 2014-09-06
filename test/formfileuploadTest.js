var FormFileUpload = require('../src/js/formfileupload.js');
var helper         = require('../src/js/helper.js')
var assert         = require('assert');
var sinon          = require('sinon');
var expect         = require('expect.js');
var mocha          = require('mocha');
var jsdom          = require("jsdom").jsdom;

global.document = jsdom("<section class='js_fileupload fileupload'><div class='js_form'></div><div class='js_dropbox'>bla</div><ul class='js_list'></ul></section>");
global.window   = document.parentWindow;

var optionsMock      = sinon.spy();
var fileUploadElMock = window.document.querySelector('.js_fileupload');

global.FileReader = function(){
	this.onload = sinon.spy();
	this.onerror = sinon.spy();
	this.readAsDataURL = sinon.spy();
};

var nativeFilePng = {
	name: 'Testfile.png',
	type: 'image/png',
	size: '219308'
};

var nativeFileTiff = {
	name: 'Testfile.tiff',
	type: 'image/tiff',
	size: '123094'
};

var nativeFileGif = {
	name: 'Testfile.gif',
	type: 'image/gif',
	size: '1208'
};
var nativeFileJpg = {
	name: 'Testfile.jpg',
	type: 'image/jpeg',
	size: '92838'
};

var nativeFileXls = {
	name: 'Testfile.xls',
	type: '',
	size: '293002'
};

var evtMock = {
	dataTransfer: {
		files: [nativeFileXls, nativeFileJpg, nativeFileGif]
	}
};

describe('easyformfileupload', function() {
	describe('the public api', function(){
		var formfileupload = new FormFileUpload(fileUploadElMock, optionsMock);

		it('should expose the function dndHandler', function() {
			expect(formfileupload.dndHandler).to.be.a('function');
		})
	})

	describe('drop file to dropzone', function(){
		var formfileupload = new FormFileUpload(fileUploadElMock, optionsMock);
		formfileupload.dndHandler(evtMock);

		it('should add an element to the DOM', function(){
			// expect(fileUploadElMock).toContain('li');
			it('elements should have the correct data', function(){

			})
		})
	})

	describe('form submitted files are sent to the server', function(){
		// server tests
	})
})
