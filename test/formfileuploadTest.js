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
	size: '29300'
};

var evtMock = {
	dataTransfer: {
		files: [nativeFileXls, nativeFileJpg, nativeFileGif]
	}
};

describe('easyformfileupload', function() {
	describe('the public api', function(){
		// var formfileupload = new FormFileUpload(fileUploadElMock, optionsMock);

		it('should expose the public api', function() {
			// expect(formfileupload.addDroppedFiles).to.be.a('function');
			// expect(formfileupload.validateFile).to.be.a('function');
			// expect(formfileupload.showErrorMessage).to.be.a('function');
			// expect(formfileupload.removeErrors).to.be.a('function');
		})
	})

	describe('drop file to dropzone', function(){
		// var formfileupload = new FormFileUpload(fileUploadElMock, optionsMock);
		// formfileupload.addDroppedFiles(evtMock);
	})
})
