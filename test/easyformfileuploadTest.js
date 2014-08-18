var api    = require('../src/js/easyformfileuploadapi.js')();
var assert = require('assert');
var sinon  = require('sinon');
var expect = require('expect.js');
var mocha = require('mocha');

// console.log(sinon);
// console.log(expect);
// console.log(mocha);

var self = sinon.spy();

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
	name: 'profile.jpg',
	type: 'image/jpeg',
	size: '92838478'
};

var nativeFileXls = {
	name: 'Testfile.xls',
	type: '',
	size: '293002'
};

describe('EasyFormFileUploadApi', function() {

	describe('api', function() {
		it('check API functions', function() {
			expect(extractDOMNodes).to.be.a('function')
			expect(toArray).to.be.a('function')
			expect(hasFileReader).to.be.a('function')
			expect(noPropagation).to.be.a('function')
			expect(mergeOptions).to.be.a('function')
		})
	})
})

describe('EasyFormFileUpload', function() {

	describe('extractDOMNodes', function() {
		describe('extractDOMNodes called with JqueryInput', function() {

			var JqueryMock = function() {
				this[0] = 'jqueryElement';
			};

			var jqueryMock = new JqueryMock();

			it('should return the value of the JqueryMock', function() {
				assert.equal('jqueryElement', extractDOMNodes(jqueryMock)[0]);
			})
		})

		describe('extractDOMNodes called with DOM Object', function() {

			var DOMNodeMock = 'domElement';

			it('should return the value of the DOMNodeMock', function() {
				assert.equal('domElement', extractDOMNodes(DOMNodeMock));
			})
		})
	})

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

		noPropagation(evtMock);

		it('should call stopPropagation once', function() {
			assert(evtMock.stopPropagation.calledOnce);
		})

		it('should call preventDefault once if the method is available', function() {
			assert(evtMock.preventDefault.calledOnce);
		})

		it('preventDefault has to be undefined', function() {
			expect(noPreventDefaultMock.preventDefault).to.be(undefined)
		})

		it('returnvalue has to be false if no preventDefault exist', function() {
			expect(noPreventDefaultMock.returnValue).to.be(false)
		})
	})

	describe('toArray', function() {

		var mockArrayInObject = {
			0: [0, 1, 2, 3],
			1: [2, 3, 4, 5]
		};

		var hasToBeAnArray = toArray(mockArrayInObject[0]);

		it('takes an array in an object and converts it to an array', function() {
			expect(hasToBeAnArray).to.be.an(Array);
			assert.equal(hasToBeAnArray.indexOf(0), 0);
		})
	})

	describe('hasFileReader', function() {
		//maybe mock a window object to test this method
	})

	describe('mergeOptions', function() {

		var mockObjA = {
			errorMessageTimeout: 5000,
			maxFileSize: 3145728,
			maxFileNumber: 3
		};

		var mockObjB = {
			maxFileSize: 12312313,
			maxFileNumber: 23
		};

		var options = mergeOptions(mockObjB, mockObjA, self);

		it('should return the merged options from default options', function() {
			assert.equal(options.hasOwnProperty('errorMessageTimeout'), true);
			assert.equal(options.hasOwnProperty('maxFileSize'), true);
			assert.equal(options.hasOwnProperty('maxFileNumber'), true);
			assert.equal(options.errorMessageTimeout, 5000);
			assert.equal(options.maxFileSize, 12312313);
			assert.equal(options.maxFileNumber, 23);
		})
	})

	describe('getFileType', function() {

		var nativeFileXls = {
			name: 'Testfile.xls',
			type: '',
			size: '92838478'
		};

		var nativeFileJpg = {
			name: 'profile.jpg',
			type: 'image/jpeg',
			size: '92838478'
		};

		describe('should return the filetype based on the native file', function() {
			it('should return the right filetype for an excel file', function(){
				var filetype = getFileType(nativeFileXls);
				assert(filetype, 'application/vnd.ms-excel');
			})

			it('should return the right filetype for an jpeg image', function(){
				var filetype= getFileType(nativeFileJpg);
				assert(filetype, 'image/jpeg');
			})
		})
	})

	describe('getReadableFileSize', function() {

		describe('depending how large the file is in bytes, should return the best unit for it', function() {
			it('should return the the size 92838478 and return the proper size 88.5 with the right unitsize KB', function(){
				assert(getReadableFileSize(nativeFileJpg), '88.5 MB');
			})

			it('should return the the size 293002 and return the proper size 286.1 with the right unitsize MB', function(){
				assert(getReadableFileSize(nativeFileXls), '286.1 KB');
			})
		})
	})

	describe('isImage', function() {

		describe('returns true if filetype contains image', function() {
			it('should return true for jpg, tiff, gif & png', function(){
				assert(getReadableFileSize(nativeFileJpg), true);
				assert(getReadableFileSize(nativeFilePng), true);
				assert(getReadableFileSize(nativeFileTiff), true);
				assert(getReadableFileSize(nativeFileGif), true);
			})

			it('should return false for example excel', function(){
				assert(getReadableFileSize(nativeFileXls), false);
			})
		})
	})
})
