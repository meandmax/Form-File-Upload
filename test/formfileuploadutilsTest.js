var utils  = require('../src/js/formfileuploadutils.js');
var assert = require('assert');
var sinon  = require('sinon');
var expect = require('expect.js');
var mocha  = require('mocha');

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
			expect(hasToBeAnArray[0]).to.be(0);
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
			expect(trackData.fileNumber).to.be(1);
			expect(trackData.requestSize).to.be(fileMockD.size);
		});

		it('update the filetrackdata, second file', function() {
			expect(trackData.fileNumber).to.be(2);
			expect(trackData.requestSize).to.be(fileMockD.size*2);
		});
	});

	describe('untrackFile', function() {
		var trackData = { fileNumber: 1, requestSize: fileMockB.size };
		utils.untrackFile(fileMockB, trackData);

		it('decrement the fileNumber by one and the requestsize by the filesize', function(){
			expect(trackData.fileNumber).to.be(0);
			expect(trackData.requestSize).to.be(0);
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

		it('return the prettified filetype if the filetype is defined in acceptedTypes', function(){
			expect(utils.getReadableFileType(fileMockA.type, options)).to.be(options.acceptedTypes['image/png']);
		});

		it('return unknown filetype if the filetype is not in acceptedTypes', function(){
			expect(utils.getReadableFileType(fileMockB.type, options)).to.be('unknown filetype');
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

			it('return true with a filenumber of 2', function(){
				expect(utils.validateFileNumber(trackData, options)).to.be(true);
			});

			it('return false with a filenumber of 4', function(){
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

			it('return true with a requestSize of zero', function(){
				expect(utils.validateRequestSize(trackData.requestSize, options)).to.be(true);
			});


			it('return false with a requestSize larger then 9 MB', function(){
				expect(utils.validateRequestSize(trackData.requestSize, options)).to.be(false);
			});
		});

		describe('validateFileType', function(){
			before(function(){
				options.acceptedTypes = {'image/png': 'PNG-Bild'};
			});

			it('return true if the filetype is defined in acceptedTypes', function(){
				expect(utils.validateFileType(utils.getFileType(fileMockA), options)).to.be(true);
			});

			it('return false if filetpe is not defined in acceptedTypes', function(){
				expect(utils.validateFileType(utils.getFileType(fileMockB), options)).to.be(false);
			});
		});

		describe('validateFileSize', function(){

			before(function(){
				options.maxFileSize = 3145728;
			});

			it('return true if the filename is allowed', function(){
				expect(utils.validateFileSize(fileMockA, options)).to.be(true);
			});

			it('return the error message if the filename is not allowed', function(){
				expect(utils.validateFileSize(fileMockB, options)).to.be(false);
			});
		});

		describe('validateFileName', function(){

			before(function(){
				options.fileNameRe = /^[A-Za-z0-9.-_ ]+$/;
			});

			it('return true if the name has no forbidden characters', function(){
				expect(utils.validateFileName(fileMockA, options)).to.be(true);
			});

			it('return false if filename has forbidden characters', function(){
				expect(utils.validateFileName(fileMockB, options)).to.be(false);
			});
		});
	});
});
