var utils  = require('../src/js/formfileuploadutils.js');
var assert = require('assert');
var sinon  = require('sinon');
var expect = require('expect.js');
var mocha  = require('mocha');
var jsdom  = require("jsdom").jsdom;

global.document = jsdom("<section class='js_fileupload fileupload'><div class='js_form wide'><div class='js_dropbox'>bla</div><div class='js_fileinputs'></div><ul class='js_list'></ul></div></section>");
global.window   = document.parentWindow;

var optionsMock = {};
var self = {};

global.FileReader = function() {
	this.onload = sinon.spy();
	this.onerror = sinon.spy();
	this.readAsDataURL = sinon.spy();
};

var fileMockA = { name: 'Testfile.png', type: 'image/png', size: 1024};
var fileMockB = { name: 'Testfile::$$__=**.tiff', type: 'image/tiff', size: 1073741824};
var fileMockC = { name: 'Testfile.gif', type: 'image/gif', size: 1208};
var fileMockD = { name: 'Testfile.jpg', type: 'image/jpeg', size: 92838};
var fileMockE = { name: 'Testfile.xls', type: '', size: 29300};

var evtMock = {
	dataTransfer: {
		files: [fileMockA, fileMockB, fileMockC]
	}
};

var options = {};
var trackData = {};

describe('easyformfileuploadutils', function() {
	describe('has functions', function() {
		it('has all expected functions', function() {
			expect(utils.trackFile).to.be.a('function');
			expect(utils.untrackFile).to.be.a('function');
			expect(utils.getReadableFileSize).to.be.a('function');
			expect(utils.getReadableFileType).to.be.a('function');
			expect(utils.validateFileNumber).to.be.a('function');
			expect(utils.validateRequestSize).to.be.a('function');
			expect(utils.validateFileType).to.be.a('function');
			expect(utils.validateFileSize).to.be.a('function');
			expect(utils.validateFileName).to.be.a('function');
			expect(utils.showErrorMessage).to.be.a('function');
			expect(utils.removeErrors).to.be.a('function');
			expect(utils.addThumbnail).to.be.a('function');
			expect(utils.createListElement).to.be.a('function');
			expect(utils.addFileToView).to.be.a('function');
			expect(utils.addBase64ToDom).to.be.a('function');
			expect(utils.createInputElement).to.be.a('function');
		});
	});

	describe('extractDOMNodes', function() {
		describe('extractDOMNodes called with JqueryInput', function() {

			var JqueryMock = function() {
				this[0] = 'jqueryElement';
			};

			var jqueryMock = new JqueryMock();

			it('returns the value of the JqueryMock', function() {
				expect(utils.extractDOMNodes(utils.extractDOMNodes(jqueryMock)[0])).to.be('jqueryElement');
			})
		})

		describe('extractDOMNodes called with DOM Object', function() {

			var DOMNodeMock = 'domElement';

			it('returns the value of the DOMNodeMock', function() {
				expect(utils.extractDOMNodes(DOMNodeMock)).to.be('domElement');
			});
		});
	});

	describe('noPropagation', function() {
		var EventMock = function() {
			this.stopPropagation = sinon.spy();
			this.preventDefault = sinon.spy();
			this.returnValue = false;
		};

		var NoPreventDefaultMock = function() {
			this.stopPropagation = sinon.spy();
			this.returnValue = false;
		};

		var evtMock              = new EventMock();
		var noPreventDefaultMock = new NoPreventDefaultMock();

		utils.noPropagation(evtMock);

		it('call stopPropagation once and before preventDefault', function() {
			assert(evtMock.stopPropagation.calledOnce);
			assert(evtMock.stopPropagation.calledBefore(evtMock.preventDefault));
		})

		it('call preventDefault once if the method is available', function() {
			assert(evtMock.preventDefault.calledOnce);
		})

		it('preventDefault has to be undefined', function() {
			expect(noPreventDefaultMock.preventDefault).to.be(undefined);
		})

		it('returnvalue has to be false if no preventDefault exist', function() {
			expect(noPreventDefaultMock.returnValue).to.be(false);
		});
	});

	describe('toArray', function() {
		var mockArrayInObject = {
			0: [0, 1, 2, 3],
			1: [2, 3, 4, 5]
		};

		var hasToBeAnArray = utils.toArray(mockArrayInObject[0]);

		it('takes an array in an object and converts it to an array', function() {
			expect(hasToBeAnArray).to.be.an(Array);
			assert.equal(hasToBeAnArray.indexOf(0), 0);
		});
	});

	describe('mergeOptions', function() {
		var mockOptionsA = {errorMessageTimeout: 5000, maxFileSize: 3145728, maxFileNumber: 3};
		var mockOptionsB = { maxFileSize: 12312313,maxFileNumber: 23};
		var options = utils.mergeOptions(mockOptionsB, mockOptionsA, self);

		it('returns the merged options from default options and the user options', function() {
			expect(options.hasOwnProperty('errorMessageTimeout')).to.be(true);
			expect(options.hasOwnProperty('maxFileSize')).to.be(true);
			expect(options.hasOwnProperty('maxFileNumber')).to.be(true);
			expect(options.errorMessageTimeout).to.be(5000);
			expect(options.maxFileSize).to.be(12312313);
			expect(options.maxFileNumber).to.be(23);
		});
	});

	describe('getFileType', function() {
		describe('return the filetype based on the passed file object', function() {
			it('returns the right filetype for an png image', function(){
				expect(utils.getFileType(fileMockA)).to.be('image/png');
			});

			it('returns the right filetype for an excel file', function(){
				expect(utils.getFileType(fileMockE)).to.be('application/vnd.ms-excel');
			});
		});
	});

	describe('trackFile', function() {
		var trackData = { fileNumber: 0, requestSize: 0 };

		beforeEach(function(){
			utils.trackFile(fileMockD, trackData);
		});

		it('update the filetrackdata, first file', function() {
			assert.equal(trackData.fileNumber, 1);
			assert.equal(trackData.requestSize, fileMockD.size);
		});

		it('update the filetrackdata, second file', function() {
			assert.equal(trackData.fileNumber, 2);
			assert.equal(trackData.requestSize, fileMockD.size*2);
		});
	});

	describe('untrackFile', function() {
		var trackData = { fileNumber: 1, requestSize: fileMockB.size };
		utils.untrackFile(fileMockB, trackData);

		it('decrement the fileNumber by one and the requestsize by the filesize', function(){
			assert.equal(trackData.fileNumber, 0);
			assert.equal(trackData.requestSize, 0);
		});
	});

	describe('getReadableFileSize', function() {
		describe('depending how large the file is in bytes, should return the correct size unit and the converted size for it', function() {
			it('the the size of 1073741824 bytes is converted to 1 with the right unitsize, in this case giga bytes', function(){
				expect(utils.getReadableFileSize(fileMockB)).to.be('1 GB');
			});

			it('the the size of 1024 bytes is converted to 1 with the right unitsize, in this case kilo bytes', function(){
				expect(utils.getReadableFileSize(fileMockA)).to.be('1 KB');
			});
		});
	});

	describe('getReadableFileType', function(){
		var options = {
			acceptedTypes: {'image/png': 'PNG-Bild'}
		}

		it('return the prettified filetype', function(){
			expect(utils.getReadableFileType(fileMockA.type, options)).to.be(options.acceptedTypes['image/png']);
		});

		it('return the string for unknown filetypes', function(){
			expect(utils.getReadableFileType(fileMockB.type, options)).to.be('Unbekannt');
		});
	});

	describe('validation', function(){

		describe('validateFileNumber', function(){
			before(function(){
				options = {
					maxFileNumber: 3,
				};

				trackData = {
					fileNumber: 1
				};
			});

			beforeEach(function(){
				trackData.fileNumber += 1;
			});

			it('has to return true with a filenumber of 2', function(){
				expect(utils.validateFileNumber(trackData, options)).to.be(true);
			});

			it('has to return the error message with a filenumber of 4', function(){
				expect(utils.validateFileNumber(trackData, options)).to.be(false);
			});
		});

		describe('validateRequestSize', function(){
			before(function(){
				options.maxRequestSize = 9437184;
				trackData.requestSize = 0;
			});

			beforeEach(function(){
				trackData.requestSize += 9437183;
			});

			it('has to return true with a requestSize of zero', function(){
				expect(utils.validateRequestSize(trackData.requestSize, options)).to.be(true);
			});


			it('has to return the error message with a requestSize larger then 9 MB', function(){
				expect(utils.validateRequestSize(trackData.requestSize, options)).to.be(false);
			});
		});

		describe('validateFileType', function(){
			before(function(){
				options.acceptedTypes = {'image/png': 'PNG-Bild'};
			});

			it('has to return the error message as tiff is not in acceptedTypes', function(){
				expect(utils.validateFileType(utils.getFileType(fileMockA), options)).to.be(true);
			});

			it('has to return the error message as tiff is not in acceptedTypes', function(){
				expect(utils.validateFileType(utils.getFileType(fileMockB), options)).to.be(false);
			});
		});

		describe('validateFileSize', function(){

			before(function(){
				options.maxFileSize = 3145728;
			});

			it('has to return true if the filename is allowed', function(){
				expect(utils.validateFileSize(fileMockA, options)).to.be(true);
			});

			it('has to return the error message if the filename is not allowed', function(){
				expect(utils.validateFileSize(fileMockB, options)).to.be(false);
			});
		});

		describe('validateFileName', function(){

			before(function(){
				options.fileNameRe = /^[A-Za-z0-9.-_ ]+$/;
			});

			it('has to return true if the name has no forbidden characters', function(){
				expect(utils.validateFileName(fileMockA, options)).to.be(true);
			});

			it('has to return the error message if filename has forbidden characters', function(){
				expect(utils.validateFileName(fileMockB, options)).to.be(false);
			});
		});
	});

	describe('show error message', function(){
		var errorTimeoutId;
		var removeErrors = sinon.spy();
		var error        = 'An error';
		var options      = {errorMessageTimeout: 5000};
		var errorWrapper = document.createElement('div');
		var form         = document.querySelector('.js_form');
		var fileView     = document.querySelector('.js_list');

		var formSpy = sinon.spy(form, 'insertBefore');
		var errorWrapperSpy = sinon.spy(errorWrapper, 'appendChild');
		var createElementSpy = sinon.spy(document, 'createElement');

		before(function(){
			utils.showErrorMessage(error, errorTimeoutId, removeErrors, errorWrapper, form, fileView, options);
		});

		describe('showErrorMessage', function(){
			it('has to call all expected functions', function(){
				assert(createElementSpy.calledOnce)
				assert(formSpy.calledOnce);
				assert(errorWrapperSpy.calledOnce);
				assert(errorWrapperSpy.calledBefore(formSpy));
				assert(formSpy.calledWith(errorWrapper, fileView));
			});
		});

		describe('showErrorMessage Integration', function(){
			it('the DOM has to contain the Error Element', function(){
				expect(document.documentElement.innerHTML).to.be.contain('error');
			});
		});
	});

	describe('removeErrors', function(){

		var errorWrapper = {
			innerHTML: 'an errorMessage'
		};

		var querySelectorSpy = sinon.spy(document, 'querySelectorAll');

		beforeEach(function(){
			utils.removeErrors(errorWrapper);
		});

		it('has to remove all errors', function(){
			assert.equal('', errorWrapper.innerHTML);
			assert(querySelectorSpy.calledOnce);
		});
	});
});
