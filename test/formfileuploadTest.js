var FormFileUpload = require('../src/js/formfileupload.js');
var helper         = require('../src/js/helper.js')
var assert         = require('assert');
var sinon          = require('sinon');
var expect         = require('expect.js');
var mocha          = require('mocha');

global.document = {
	querySelector: sinon.spy(),
	createElement: function(el) {
		if(el === 'li') {
			return '<li></li>';
		}
		if(el === 'span') {
			return '<span></span>';
		}
		if(el === 'div') {
			return '<div></div>';
		}
	},
	querySelectorAll: sinon.spy()
};

global.window = {
	File: true,
	FileReader: true,
	FileList: true
}

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

var evtMock = {
	dataTransfer: {
		files: [nativeFileXls, nativeFileJpg, nativeFileGif]
	}
};

var optionsMock        = sinon.spy();
var fileUploadElMock   = '<section class="js_fileupload fileupload"></section>';

var dropBoxElMock = {
	node: '<div class="dropbox"></div>',
	addEventListener: sinon.spy()
};

describe('easyformfileupload', function() {
	describe('the public api', function(){
		var formfileupload = new FormFileUpload(fileUploadElMock, dropBoxElMock, optionsMock);

		it('should expose the function dndHandler', function() {
			expect(formfileupload.dndHandler).to.be.a('function');
		})
	})

	describe('drop file to dropzone', function(){
		var formfileupload = new FormFileUpload(fileUploadElMock, dropBoxElMock, optionsMock);
		formfileupload.dndHandler(evtMock);

		it('should add an element to the DOM', function(){
			//expect(fileUploadElMock).toContain('li');
			console.log(fileUploadElMock);
			it('elements should have the correct data', function(){

			})
		})
	})

	describe('form submitted files are sent to the server', function(){
		// server tests
	})
})
