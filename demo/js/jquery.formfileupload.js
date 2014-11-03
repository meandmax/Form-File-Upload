(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global document, FileReader */

var utils = require('./formfileuploadutils.js');

var FormFileUpload = function(fileUpload_, opts){

	'use strict';

	var errorTimeoutId;
	var fileInputId = 0;

	var trackData = {
		fileNumber: 0,
		requestSize: 0
	};

	var self         = this;
	var dropBox      = document.querySelector('.js_dropbox');
	var fileView     = document.querySelector('.js_list');
	var fileInputs   = document.querySelector('.js_fileinputs');
	var form         = document.querySelector('.js_form');
	var errorWrapper = document.createElement('div');
	var selectButton = document.createElement('div');

	var defaultOptions = {

		/**
		 * [timeout specifies how long the error messages are displayed]
		 * @type {Number}
		 */
		errorMessageTimeout: 5000,

		/**
		 * [the maximum filesize of each file in bytes]
		 * @type {Number}
		 */
		maxFileSize: 3145728,

		/**
		 * [maxFileNumber defines how many files are allowed to upload with each request]
		 * @type {Number}
		 */
		maxFileNumber: 3,

		/**
		 * [Size of thumbnails displayed in the browser for preview the images]
		 * @type {Number}
		 */
		thumbnailSize: 100,

		/**
		 * [defines the maximum size of each request in bytes]
		 * @type {Number}
		 */
		maxRequestSize: 9437184,

		/**
		 * [If true the fallback for IE8 is activated]
		 * @type {Boolean}
		 */
		fallbackForIE8: true,

		/**
		 * [Regular Expression for filename matching]
		 * @type {String}
		 */
		fileNameRe: /^[A-Za-z0-9.\-_ ]+$/,

		/**
		 * [errormessage displayed when the file has characters which are not allowed]
		 * @type {String}
		 */
		invalidFileNameError: 'The name of the file has forbidden characters',

		/**
		 * [errormessage displayed when the filetype is not allowed]
		 * @type {String}
		 */
		invalidFileTypeError: 'The fileformat is not allowed',

		/**
		 * [errormessage displayed when the max. requestsize is reached]
		 * @type {String}
		 */
		maxRequestSizeError: 'The requestsize of the files you want to upload is exceeded.',

		/**
		 * [errormessage displayed when the max. filenumber is reached]
		 * @type {String}
		 */
		maxFileNumberError: 'You can upload 3 files, not more!',

		/**
		 * [errormessage displayed when the max. filensize is reached]
		 * @type {String}
		 */
		maxFileSizeError: 'One of the files is too large. the maximum filesize is 3 MB.',

		/**
		 * [If something during the filereading process went wrong, then this message is displayed]
		 * @type {String}
		 */
		unknownFileReaderError: 'Unknown Error while loading the file.',

		/**
		 * [Objects contains all allowed mimetypes as keys & the prettified filenames as values]
		 * @type {Object}
		 */
		acceptedTypes: {
			'image/png': 'PNG-Bild',
			'image/jpeg': 'JPEG-Bild',
			'image/gif': 'GIF-Bild',
			'image/tiff': 'TIFF-Bild',
			'application/pdf': 'PDF-Dokument',
			'application/vnd.ms-excel': 'Excel-Dokument',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel-Dokument',
			'application/msword': 'Word-Dokument',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word-Dokument'
		}
	};

	/**
	 * Merging the default options with the user passed options together
	 * @type {[object]}
	 */
	var options = utils.mergeOptions(opts, defaultOptions, self);

	/**
	 *
	 * Callback function for handling the async filereader response
	 * @param  {[string]} err     [the errormessage which gets thrown when the filereader errored]
	 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
	 */
	var convertBase64FileHandler = function(err, fileObj) {
		if (err) {
			console.log(err);
		}

		if (fileObj) {
			var removeHandler = utils.addBase64ToDom(fileObj, form);
			var fileType = utils.getReadableFileType(utils.getFileType(fileObj.file), options);
			var listElement = utils.createListElement(fileObj.file.name, utils.getReadableFileSize(fileObj.file), fileType);
			utils.addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

			if (utils.hasFileReader) {
				utils.addThumbnail(fileObj.file, listElement, options);
			}
		}
	};

	var validateFile = function(file) {
		if(!utils.validateFileNumber(trackData, options)){
			return options.maxFileNumberError;
		}

		if(!utils.validateRequestSize(trackData, options)){
			return options.maxRequestSizeError;
		}

		if(!utils.validateFileType(utils.getFileType(file), options)){
			return options.invalidFileTypeError;
		}

		if(!utils.validateFileSize(file, options)){
			return options.maxFileSizeError;
		}

		if(!utils.validateFileName(file, options)){
			return options.invalidFileNameError;
		}

		return true;
	};

	/**
	 * [converts the filedata into a base64 string and validates the filedata]
	 * @param  {[array]}  files  [the converted fileListObject]
	 */
	this.convertFilesToBase64 = function(files){
		files.every(function(file) {
			var reader = new FileReader();


			if(typeof validateFile(file) === 'string') {
				utils.showErrorMessage(validateFile(file), errorTimeoutId, utils.removeErrors, errorWrapper, form, fileView, options);
				return false;
			}

			utils.trackFile(file, trackData);

			reader.addEventListener('load', function(event) {
				convertBase64FileHandler(null, {
					data: event.target.result,
					file: file
				});
			});

			reader.addEventListener('error', function() {
				utils.convertBase64FileHandler(options.unknownFileReaderError);
			});

			reader.readAsDataURL(file);

			return true;
		});
	};

	/**
	 * [Add a fileInput with the selected file to form]
	 */
	this.addSelectedFile = function () {

		var fileInput = utils.createInputElement(fileInputId);

		form.insertBefore(selectButton, dropBox);
		selectButton.appendChild(fileInput);

		fileInput.addEventListener('change', function () {
			utils.removeErrors(errorWrapper);

			var file = this.files[0];
			var fileObj = { file: file };

			var removeHandler = function() {
				utils.untrackFile(file, trackData);
				fileInput.parentNode.removeChild(fileInput);
			};

			if(typeof validateFile(file) === 'string') {
				utils.showErrorMessage(validateFile(file), options.errorTimeoutId, utils.removeErrors, errorWrapper, form, fileView, options);
				fileInput.parentNode.removeChild(fileInput);
			} else {
				var fileType = utils.getReadableFileType(utils.getFileType(file), options);
				var listElement = utils.createListElement(file.name, fileType, utils.getReadableFileSize(fileObj.file));

				utils.trackFile(file, trackData);
				utils.addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

				if (utils.hasFileReader) {
					utils.addThumbnail(file, listElement, options);
				}

				fileInputs.appendChild(fileInput);
			}

			self.addSelectedFile();
		});
	};

	/**
	 * drophandler calls the dndHandler always whenn a file gets dropped
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('drop', function(event) {
		utils.noPropagation(event);
		var files = utils.toArray(event.dataTransfer.files);
		self.convertFilesToBase64(files);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragenter', function(event) {
		utils.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragover', function(event) {
		utils.noPropagation(event);
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */

	dropBox.addEventListener('dragleave', function(event) {
		utils.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * If there is no filereader available, then the dropzone should not be displayed and the Fallback is displayed
	 */
	if (!utils.hasFileReader() && options.fallbackForIE8 ) {
		selectButton.className = 'selectbutton js_selectbutton';

		var span = document.createElement('span');
		span.innerHTML = 'Select File';

		selectButton.appendChild(span);

		self.addSelectedFile();
		dropBox.style.display = "none";
	}
};

module.exports = FormFileUpload;

/* global $, FormFileUpload */


$.fn.formFileUpload = function(options) {

	"use strict";

	return this.each(function() {
		var instanceOptions;

		if (!$.data(this, 'formFileUpload')) {
			instanceOptions = $.extend({}, options, $(this).data());
			$.data(this, 'formFileUpload', new FormFileUpload(this, instanceOptions));
		}
	});
};

},{"./formfileuploadutils.js":2}],2:[function(require,module,exports){
/* global window, document, FileReader, Image */

/**
 * [extractDOMNodes description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
var extractDOMNodes = function(obj) {

	'use strict';

	if(typeof obj === 'function'){
		return obj[0];
	}

	return obj;
};

/**
 * [toArray description]
 * @param  {[type]} object [description]
 * @return {[type]}        [description]
 */
var toArray = function(object) {

	'use strict';

	return Array.prototype.slice.call(object, 0);
};

/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function() {

	'use strict';

	return !!(window.File && window.FileList && window.FileReader);
};

/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
var noPropagation = function(e) {

	'use strict';

	e.stopPropagation();

	if (e.preventDefault) {
		return e.preventDefault();
	} else {
		e.returnValue = false;
		return false;
	}
};

/**
 * [mergeOptions description]
 * @param  {[type]} opts           [description]
 * @param  {[type]} defaultoptions [description]
 * @return {[type]}                [description]
 */
var mergeOptions = function(opts, defaultOptions, self) {

	'use strict';

	var options = {};

	for (var i in defaultOptions) {

		if(opts && opts.hasOwnProperty(i)) {

			options[i] = opts[i];

			if (typeof(options[i]) === 'function') {
				options[i] = options[i].bind(self);
			}

		} else {
			options[i] = defaultOptions[i];
		}

	}

	return options;
};

/**
 * Returns the Filetype
 * @param  {[type]} nativeFile [description]
 * @return {[type]}            [description]
 */
var getFileType = function (file) {

	'use strict';

	// Fix chromium issue 105382: Excel (.xls) FileReader mime type is empty.
	if ((/\.xls$/).test(file.name) && !file.type) {
		return 'application/vnd.ms-excel';
	}
	return file.type;
};

/**
 * Takes the native filesize in bytes and returns the prettified filesize
 * @param  {[object]} file [contains the size of the file]
 * @return {[string]}      [prettified filesize]
 */
var getReadableFileSize = function(file) {

	'use strict';

	var size = file.size;
	var string;

	if (size >= 1024 * 1024 * 1024 * 1024 ) {
		size = size / (1024 * 1024 * 1024 * 1024 / 10);
		string = 'TB';
	} else if (size >= 1024 * 1024 * 1024 ) {
		size = size / (1024 * 1024 * 1024 / 10);
		string = 'GB';
	} else if (size >= 1024 * 1024) {
		size = size / (1024 * 1024 / 10);
		string = 'MB';
	} else if (size >= 1024) {
		size = size / (1024 / 10);
		string = 'KB';
	} else {
		size = size * 10;
		string = 'B';
	}

	return (Math.round(size) / 10) + ' ' + string;
};

/**
 * [isImage description]
 * @param  {[type]}  file [description]
 * @return {Boolean}      [description]
 */
var isImage = function(file) {

	'use strict';

	return (/^image\//).test(getFileType(file));
};

/**
 * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var trackFile = function(file, trackData) {

	'use strict';

	trackData.fileNumber += 1;
	trackData.requestSize += file.size;
};

/**
 * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var untrackFile = function (file, trackData) {
	'use strict';

	trackData.fileNumber -= 1;
	trackData.requestSize -= file.size;
};

/**
 * [returns the prettified filestype string based on the specified options]
 * @param  {[string]} fileType [mimetype of file]
 * @return {[string]}      [prettified typestring]
 */
var getReadableFileType = function (fileType, options) {

	'use strict';

	return options.acceptedTypes[fileType] || 'unknown filetype';
};

var validateFileNumber = function(trackData, options) {

	'use strict';

	if (trackData.fileNumber >= options.maxFileNumber) {
		return false;
	}

	return true;
};

var validateRequestSize = function(requestSize, options) {

	'use strict';

	if (requestSize >= options.maxRequestSize) {
		return false;
	}

	return true;
};

var validateFileType = function(fileType, options) {

	'use strict';

	if (!options.acceptedTypes[fileType]) {
		return false;
	}

	return true;
};

var validateFileSize = function(file, options) {

	'use strict';

	if (file.size > options.maxFileSize) {
		return false;
	}

	return true;
};

var validateFileName = function(file, options) {

	'use strict';

	if (!(options.fileNameRe).test(file.name)) {
		return false;
	}

	return true;
};

/**
 * [displays the Error message & removes it also after the specified timeout]
 * @param  {[string]} error [error message which has to be displayed]
 */
var showErrorMessage = function(error, errorTimeoutId, removeErrors, errorWrapper, form, fileView, options) {

	'use strict';

	var errorElement = document.createElement('li');

	errorElement.className = 'error';
	errorElement.innerHTML = error;

	clearTimeout(errorTimeoutId);

	errorTimeoutId = setTimeout(function() {
		removeErrors(errorWrapper);
	}, options.errorMessageTimeout);

	errorWrapper.appendChild(errorElement);
	form.insertBefore(errorWrapper, fileView);
};

/**
 * [removes all errors]
 */
var removeErrors = function(errorWrapper) {

	'use strict';

	errorWrapper.innerHTML = '';
};

/**
 * [if possible adds a thumbnail of the given file to the DOM]
 * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
 * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
 */
var addThumbnail = function(file, element, options){

	'use strict';

	var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

	var reader = new FileReader();
	var factor = window.devicePixelRatio;
	var imgWrapper = document.createElement('span');

	var canvas = document.createElement('canvas');

	canvas.width  = options.thumbnailSize * factor;
	canvas.height = options.thumbnailSize * factor;

	var ctx = canvas.getContext("2d");

	if(factor > 1){
		ctx.webkitBackingStorePixelRatio = factor;
		ctx.scale(factor, factor);
	}

	var fileName = element.querySelector('.js_name');
	var image = new Image();
	imgWrapper.className = 'thumbnail';

	image.addEventListener('load', function(){
		var ratio = this.height / this.width;

		canvas.height = canvas.width * ratio;
		ctx.drawImage(this, 0, 0, options.thumbnailSize, options.thumbnailSize * ratio);
	});

	reader.addEventListener('load', function(event){
		if (isImage(file)) {
			image.src = event.target.result;
		} else {
			image.src = EMPTY_IMAGE;
		}

		imgWrapper.appendChild(canvas);
		element.insertBefore(imgWrapper, fileName);
	});

	reader.readAsDataURL(file);
};

/**
 * [Creates a listElement with the data of the passed object]
 * @param  {[type]} fileObj [used to put the information of the file in the listElememt]
 * @return {[object]}       [the listElement which gets injected in the DOM]
 */
var createListElement = function(fileName, fileSize, fileType){

	'use strict';

	var fileElement = document.createElement('li');
	fileElement.className = 'file';

	fileElement.innerHTML = [
	'<span class="label js_name name">',
	fileName,
	'</span><span class="label size">',
	fileSize,
	'</span><span class="label type">',
	fileType,
	'</span>'].join('');

	return fileElement;
};

/**
 * [Creates a list item which gets injected to the DOM]
 * @param {[object]} fileObj             [filedata for adding the filedata & preview to the DOM]
 * @param {[function]} removeFileHandler [callback for notifying that the specified file was deleted]
 */
var addFileToView = function(fileObj, removeFileHandlerCallback, trackData, fileView, listElement){

	'use strict';

	// Add remove Element & register remove Handler
	var removeButton = document.createElement('span');
	removeButton.className = 'remove';
	listElement.appendChild(removeButton);

	fileView.appendChild(listElement);

	removeButton.addEventListener('click', function() {

		// calls the callback of the DND Handler
		removeFileHandlerCallback(trackData);

		// remove fileViewElement
		listElement.parentNode.removeChild(listElement);

		untrackFile(fileObj.file, trackData);
	});
};

/**
 * [Creates a hidden input field where the base64 data is stored]
 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
 */
var addBase64ToDom = function(fileObj, form){

	'use strict';

	var input = document.createElement("input");

	input.type = "hidden";
	input.value = fileObj.data;
	input.name = 'file:' + fileObj.file.name;

	form.appendChild(input);

	return function(){
		input.parentNode.removeChild(input);
	};
};

/**
 * [createInputElement description]
 * @return {[type]} [description]
 */
var createInputElement = function(fileInputId){

	'use strict';

	var fileInput = document.createElement('input');

	fileInput.type = 'file';
	fileInput.className = 'fileinput';
	fileInputId += 1;

	fileInput.name = 'fileInput ' + fileInputId;

	return fileInput;
};

exports.extractDOMNodes     = extractDOMNodes;
exports.toArray             = toArray;
exports.hasFileReader       = hasFileReader;
exports.noPropagation       = noPropagation;
exports.mergeOptions        = mergeOptions;
exports.getFileType         = getFileType;
exports.getReadableFileSize = getReadableFileSize;
exports.isImage             = isImage;
exports.addBase64ToDom      = addBase64ToDom;
exports.createInputElement  = createInputElement;
exports.removeErrors        = removeErrors;
exports.trackFile           = trackFile;
exports.untrackFile         = untrackFile;
exports.getReadableFileType = getReadableFileType;
exports.validateFileNumber  = validateFileNumber;
exports.validateRequestSize = validateRequestSize;
exports.validateFileType    = validateFileType;
exports.validateFileSize    = validateFileSize;
exports.validateFileName    = validateFileName;
exports.showErrorMessage    = showErrorMessage;
exports.createListElement   = createListElement;
exports.addThumbnail        = addThumbnail;
exports.addFileToView       = addFileToView;
exports.addBase64ToDom      = addBase64ToDom;
exports.createInputElement  = createInputElement;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvZmFrZV83OTlmM2IxYS5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL2Zvcm1maWxldXBsb2FkdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgZG9jdW1lbnQsIEZpbGVSZWFkZXIgKi9cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi9mb3JtZmlsZXVwbG9hZHV0aWxzLmpzJyk7XG5cbnZhciBGb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uKGZpbGVVcGxvYWRfLCBvcHRzKXtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGVycm9yVGltZW91dElkO1xuXHR2YXIgZmlsZUlucHV0SWQgPSAwO1xuXG5cdHZhciB0cmFja0RhdGEgPSB7XG5cdFx0ZmlsZU51bWJlcjogMCxcblx0XHRyZXF1ZXN0U2l6ZTogMFxuXHR9O1xuXG5cdHZhciBzZWxmICAgICAgICAgPSB0aGlzO1xuXHR2YXIgZHJvcEJveCAgICAgID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmpzX2Ryb3Bib3gnKTtcblx0dmFyIGZpbGVWaWV3ICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19saXN0Jyk7XG5cdHZhciBmaWxlSW5wdXRzICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZmlsZWlucHV0cycpO1xuXHR2YXIgZm9ybSAgICAgICAgID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmpzX2Zvcm0nKTtcblx0dmFyIGVycm9yV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHR2YXIgc2VsZWN0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cblx0dmFyIGRlZmF1bHRPcHRpb25zID0ge1xuXG5cdFx0LyoqXG5cdFx0ICogW3RpbWVvdXQgc3BlY2lmaWVzIGhvdyBsb25nIHRoZSBlcnJvciBtZXNzYWdlcyBhcmUgZGlzcGxheWVkXVxuXHRcdCAqIEB0eXBlIHtOdW1iZXJ9XG5cdFx0ICovXG5cdFx0ZXJyb3JNZXNzYWdlVGltZW91dDogNTAwMCxcblxuXHRcdC8qKlxuXHRcdCAqIFt0aGUgbWF4aW11bSBmaWxlc2l6ZSBvZiBlYWNoIGZpbGUgaW4gYnl0ZXNdXG5cdFx0ICogQHR5cGUge051bWJlcn1cblx0XHQgKi9cblx0XHRtYXhGaWxlU2l6ZTogMzE0NTcyOCxcblxuXHRcdC8qKlxuXHRcdCAqIFttYXhGaWxlTnVtYmVyIGRlZmluZXMgaG93IG1hbnkgZmlsZXMgYXJlIGFsbG93ZWQgdG8gdXBsb2FkIHdpdGggZWFjaCByZXF1ZXN0XVxuXHRcdCAqIEB0eXBlIHtOdW1iZXJ9XG5cdFx0ICovXG5cdFx0bWF4RmlsZU51bWJlcjogMyxcblxuXHRcdC8qKlxuXHRcdCAqIFtTaXplIG9mIHRodW1ibmFpbHMgZGlzcGxheWVkIGluIHRoZSBicm93c2VyIGZvciBwcmV2aWV3IHRoZSBpbWFnZXNdXG5cdFx0ICogQHR5cGUge051bWJlcn1cblx0XHQgKi9cblx0XHR0aHVtYm5haWxTaXplOiAxMDAsXG5cblx0XHQvKipcblx0XHQgKiBbZGVmaW5lcyB0aGUgbWF4aW11bSBzaXplIG9mIGVhY2ggcmVxdWVzdCBpbiBieXRlc11cblx0XHQgKiBAdHlwZSB7TnVtYmVyfVxuXHRcdCAqL1xuXHRcdG1heFJlcXVlc3RTaXplOiA5NDM3MTg0LFxuXG5cdFx0LyoqXG5cdFx0ICogW0lmIHRydWUgdGhlIGZhbGxiYWNrIGZvciBJRTggaXMgYWN0aXZhdGVkXVxuXHRcdCAqIEB0eXBlIHtCb29sZWFufVxuXHRcdCAqL1xuXHRcdGZhbGxiYWNrRm9ySUU4OiB0cnVlLFxuXG5cdFx0LyoqXG5cdFx0ICogW1JlZ3VsYXIgRXhwcmVzc2lvbiBmb3IgZmlsZW5hbWUgbWF0Y2hpbmddXG5cdFx0ICogQHR5cGUge1N0cmluZ31cblx0XHQgKi9cblx0XHRmaWxlTmFtZVJlOiAvXltBLVphLXowLTkuXFwtXyBdKyQvLFxuXG5cdFx0LyoqXG5cdFx0ICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgZmlsZSBoYXMgY2hhcmFjdGVycyB3aGljaCBhcmUgbm90IGFsbG93ZWRdXG5cdFx0ICogQHR5cGUge1N0cmluZ31cblx0XHQgKi9cblx0XHRpbnZhbGlkRmlsZU5hbWVFcnJvcjogJ1RoZSBuYW1lIG9mIHRoZSBmaWxlIGhhcyBmb3JiaWRkZW4gY2hhcmFjdGVycycsXG5cblx0XHQvKipcblx0XHQgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBmaWxldHlwZSBpcyBub3QgYWxsb3dlZF1cblx0XHQgKiBAdHlwZSB7U3RyaW5nfVxuXHRcdCAqL1xuXHRcdGludmFsaWRGaWxlVHlwZUVycm9yOiAnVGhlIGZpbGVmb3JtYXQgaXMgbm90IGFsbG93ZWQnLFxuXG5cdFx0LyoqXG5cdFx0ICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgbWF4LiByZXF1ZXN0c2l6ZSBpcyByZWFjaGVkXVxuXHRcdCAqIEB0eXBlIHtTdHJpbmd9XG5cdFx0ICovXG5cdFx0bWF4UmVxdWVzdFNpemVFcnJvcjogJ1RoZSByZXF1ZXN0c2l6ZSBvZiB0aGUgZmlsZXMgeW91IHdhbnQgdG8gdXBsb2FkIGlzIGV4Y2VlZGVkLicsXG5cblx0XHQvKipcblx0XHQgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBtYXguIGZpbGVudW1iZXIgaXMgcmVhY2hlZF1cblx0XHQgKiBAdHlwZSB7U3RyaW5nfVxuXHRcdCAqL1xuXHRcdG1heEZpbGVOdW1iZXJFcnJvcjogJ1lvdSBjYW4gdXBsb2FkIDMgZmlsZXMsIG5vdCBtb3JlIScsXG5cblx0XHQvKipcblx0XHQgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBtYXguIGZpbGVuc2l6ZSBpcyByZWFjaGVkXVxuXHRcdCAqIEB0eXBlIHtTdHJpbmd9XG5cdFx0ICovXG5cdFx0bWF4RmlsZVNpemVFcnJvcjogJ09uZSBvZiB0aGUgZmlsZXMgaXMgdG9vIGxhcmdlLiB0aGUgbWF4aW11bSBmaWxlc2l6ZSBpcyAzIE1CLicsXG5cblx0XHQvKipcblx0XHQgKiBbSWYgc29tZXRoaW5nIGR1cmluZyB0aGUgZmlsZXJlYWRpbmcgcHJvY2VzcyB3ZW50IHdyb25nLCB0aGVuIHRoaXMgbWVzc2FnZSBpcyBkaXNwbGF5ZWRdXG5cdFx0ICogQHR5cGUge1N0cmluZ31cblx0XHQgKi9cblx0XHR1bmtub3duRmlsZVJlYWRlckVycm9yOiAnVW5rbm93biBFcnJvciB3aGlsZSBsb2FkaW5nIHRoZSBmaWxlLicsXG5cblx0XHQvKipcblx0XHQgKiBbT2JqZWN0cyBjb250YWlucyBhbGwgYWxsb3dlZCBtaW1ldHlwZXMgYXMga2V5cyAmIHRoZSBwcmV0dGlmaWVkIGZpbGVuYW1lcyBhcyB2YWx1ZXNdXG5cdFx0ICogQHR5cGUge09iamVjdH1cblx0XHQgKi9cblx0XHRhY2NlcHRlZFR5cGVzOiB7XG5cdFx0XHQnaW1hZ2UvcG5nJzogJ1BORy1CaWxkJyxcblx0XHRcdCdpbWFnZS9qcGVnJzogJ0pQRUctQmlsZCcsXG5cdFx0XHQnaW1hZ2UvZ2lmJzogJ0dJRi1CaWxkJyxcblx0XHRcdCdpbWFnZS90aWZmJzogJ1RJRkYtQmlsZCcsXG5cdFx0XHQnYXBwbGljYXRpb24vcGRmJzogJ1BERi1Eb2t1bWVudCcsXG5cdFx0XHQnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJzogJ0V4Y2VsLURva3VtZW50Jyxcblx0XHRcdCdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCc6ICdFeGNlbC1Eb2t1bWVudCcsXG5cdFx0XHQnYXBwbGljYXRpb24vbXN3b3JkJzogJ1dvcmQtRG9rdW1lbnQnLFxuXHRcdFx0J2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JzogJ1dvcmQtRG9rdW1lbnQnXG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBNZXJnaW5nIHRoZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgdXNlciBwYXNzZWQgb3B0aW9ucyB0b2dldGhlclxuXHQgKiBAdHlwZSB7W29iamVjdF19XG5cdCAqL1xuXHR2YXIgb3B0aW9ucyA9IHV0aWxzLm1lcmdlT3B0aW9ucyhvcHRzLCBkZWZhdWx0T3B0aW9ucywgc2VsZik7XG5cblx0LyoqXG5cdCAqXG5cdCAqIENhbGxiYWNrIGZ1bmN0aW9uIGZvciBoYW5kbGluZyB0aGUgYXN5bmMgZmlsZXJlYWRlciByZXNwb25zZVxuXHQgKiBAcGFyYW0gIHtbc3RyaW5nXX0gZXJyICAgICBbdGhlIGVycm9ybWVzc2FnZSB3aGljaCBnZXRzIHRocm93biB3aGVuIHRoZSBmaWxlcmVhZGVyIGVycm9yZWRdXG5cdCAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlT2JqIFt0aGUgYmFzZTY0IHN0cmluZyAmIGFsbCBtZXRhZGF0YSBjb21iaW5lZCBpbiBvbmUgb2JqZWN0XVxuXHQgKi9cblx0dmFyIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlciA9IGZ1bmN0aW9uKGVyciwgZmlsZU9iaikge1xuXHRcdGlmIChlcnIpIHtcblx0XHRcdGNvbnNvbGUubG9nKGVycik7XG5cdFx0fVxuXG5cdFx0aWYgKGZpbGVPYmopIHtcblx0XHRcdHZhciByZW1vdmVIYW5kbGVyID0gdXRpbHMuYWRkQmFzZTY0VG9Eb20oZmlsZU9iaiwgZm9ybSk7XG5cdFx0XHR2YXIgZmlsZVR5cGUgPSB1dGlscy5nZXRSZWFkYWJsZUZpbGVUeXBlKHV0aWxzLmdldEZpbGVUeXBlKGZpbGVPYmouZmlsZSksIG9wdGlvbnMpO1xuXHRcdFx0dmFyIGxpc3RFbGVtZW50ID0gdXRpbHMuY3JlYXRlTGlzdEVsZW1lbnQoZmlsZU9iai5maWxlLm5hbWUsIHV0aWxzLmdldFJlYWRhYmxlRmlsZVNpemUoZmlsZU9iai5maWxlKSwgZmlsZVR5cGUpO1xuXHRcdFx0dXRpbHMuYWRkRmlsZVRvVmlldyhmaWxlT2JqLCByZW1vdmVIYW5kbGVyLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCk7XG5cblx0XHRcdGlmICh1dGlscy5oYXNGaWxlUmVhZGVyKSB7XG5cdFx0XHRcdHV0aWxzLmFkZFRodW1ibmFpbChmaWxlT2JqLmZpbGUsIGxpc3RFbGVtZW50LCBvcHRpb25zKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0dmFyIHZhbGlkYXRlRmlsZSA9IGZ1bmN0aW9uKGZpbGUpIHtcblx0XHRpZighdXRpbHMudmFsaWRhdGVGaWxlTnVtYmVyKHRyYWNrRGF0YSwgb3B0aW9ucykpe1xuXHRcdFx0cmV0dXJuIG9wdGlvbnMubWF4RmlsZU51bWJlckVycm9yO1xuXHRcdH1cblxuXHRcdGlmKCF1dGlscy52YWxpZGF0ZVJlcXVlc3RTaXplKHRyYWNrRGF0YSwgb3B0aW9ucykpe1xuXHRcdFx0cmV0dXJuIG9wdGlvbnMubWF4UmVxdWVzdFNpemVFcnJvcjtcblx0XHR9XG5cblx0XHRpZighdXRpbHMudmFsaWRhdGVGaWxlVHlwZSh1dGlscy5nZXRGaWxlVHlwZShmaWxlKSwgb3B0aW9ucykpe1xuXHRcdFx0cmV0dXJuIG9wdGlvbnMuaW52YWxpZEZpbGVUeXBlRXJyb3I7XG5cdFx0fVxuXG5cdFx0aWYoIXV0aWxzLnZhbGlkYXRlRmlsZVNpemUoZmlsZSwgb3B0aW9ucykpe1xuXHRcdFx0cmV0dXJuIG9wdGlvbnMubWF4RmlsZVNpemVFcnJvcjtcblx0XHR9XG5cblx0XHRpZighdXRpbHMudmFsaWRhdGVGaWxlTmFtZShmaWxlLCBvcHRpb25zKSl7XG5cdFx0XHRyZXR1cm4gb3B0aW9ucy5pbnZhbGlkRmlsZU5hbWVFcnJvcjtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXHQvKipcblx0ICogW2NvbnZlcnRzIHRoZSBmaWxlZGF0YSBpbnRvIGEgYmFzZTY0IHN0cmluZyBhbmQgdmFsaWRhdGVzIHRoZSBmaWxlZGF0YV1cblx0ICogQHBhcmFtICB7W2FycmF5XX0gIGZpbGVzICBbdGhlIGNvbnZlcnRlZCBmaWxlTGlzdE9iamVjdF1cblx0ICovXG5cdHRoaXMuY29udmVydEZpbGVzVG9CYXNlNjQgPSBmdW5jdGlvbihmaWxlcyl7XG5cdFx0ZmlsZXMuZXZlcnkoZnVuY3Rpb24oZmlsZSkge1xuXHRcdFx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cblxuXHRcdFx0aWYodHlwZW9mIHZhbGlkYXRlRmlsZShmaWxlKSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0dXRpbHMuc2hvd0Vycm9yTWVzc2FnZSh2YWxpZGF0ZUZpbGUoZmlsZSksIGVycm9yVGltZW91dElkLCB1dGlscy5yZW1vdmVFcnJvcnMsIGVycm9yV3JhcHBlciwgZm9ybSwgZmlsZVZpZXcsIG9wdGlvbnMpO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHV0aWxzLnRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuXG5cdFx0XHRyZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlcihudWxsLCB7XG5cdFx0XHRcdFx0ZGF0YTogZXZlbnQudGFyZ2V0LnJlc3VsdCxcblx0XHRcdFx0XHRmaWxlOiBmaWxlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR1dGlscy5jb252ZXJ0QmFzZTY0RmlsZUhhbmRsZXIob3B0aW9ucy51bmtub3duRmlsZVJlYWRlckVycm9yKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFtBZGQgYSBmaWxlSW5wdXQgd2l0aCB0aGUgc2VsZWN0ZWQgZmlsZSB0byBmb3JtXVxuXHQgKi9cblx0dGhpcy5hZGRTZWxlY3RlZEZpbGUgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgZmlsZUlucHV0ID0gdXRpbHMuY3JlYXRlSW5wdXRFbGVtZW50KGZpbGVJbnB1dElkKTtcblxuXHRcdGZvcm0uaW5zZXJ0QmVmb3JlKHNlbGVjdEJ1dHRvbiwgZHJvcEJveCk7XG5cdFx0c2VsZWN0QnV0dG9uLmFwcGVuZENoaWxkKGZpbGVJbnB1dCk7XG5cblx0XHRmaWxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0dXRpbHMucmVtb3ZlRXJyb3JzKGVycm9yV3JhcHBlcik7XG5cblx0XHRcdHZhciBmaWxlID0gdGhpcy5maWxlc1swXTtcblx0XHRcdHZhciBmaWxlT2JqID0geyBmaWxlOiBmaWxlIH07XG5cblx0XHRcdHZhciByZW1vdmVIYW5kbGVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHV0aWxzLnVudHJhY2tGaWxlKGZpbGUsIHRyYWNrRGF0YSk7XG5cdFx0XHRcdGZpbGVJbnB1dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZpbGVJbnB1dCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRpZih0eXBlb2YgdmFsaWRhdGVGaWxlKGZpbGUpID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHR1dGlscy5zaG93RXJyb3JNZXNzYWdlKHZhbGlkYXRlRmlsZShmaWxlKSwgb3B0aW9ucy5lcnJvclRpbWVvdXRJZCwgdXRpbHMucmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcblx0XHRcdFx0ZmlsZUlucHV0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmlsZUlucHV0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBmaWxlVHlwZSA9IHV0aWxzLmdldFJlYWRhYmxlRmlsZVR5cGUodXRpbHMuZ2V0RmlsZVR5cGUoZmlsZSksIG9wdGlvbnMpO1xuXHRcdFx0XHR2YXIgbGlzdEVsZW1lbnQgPSB1dGlscy5jcmVhdGVMaXN0RWxlbWVudChmaWxlLm5hbWUsIGZpbGVUeXBlLCB1dGlscy5nZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSkpO1xuXG5cdFx0XHRcdHV0aWxzLnRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuXHRcdFx0XHR1dGlscy5hZGRGaWxlVG9WaWV3KGZpbGVPYmosIHJlbW92ZUhhbmRsZXIsIHRyYWNrRGF0YSwgZmlsZVZpZXcsIGxpc3RFbGVtZW50KTtcblxuXHRcdFx0XHRpZiAodXRpbHMuaGFzRmlsZVJlYWRlcikge1xuXHRcdFx0XHRcdHV0aWxzLmFkZFRodW1ibmFpbChmaWxlLCBsaXN0RWxlbWVudCwgb3B0aW9ucyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmaWxlSW5wdXRzLmFwcGVuZENoaWxkKGZpbGVJbnB1dCk7XG5cdFx0XHR9XG5cblx0XHRcdHNlbGYuYWRkU2VsZWN0ZWRGaWxlKCk7XG5cdFx0fSk7XG5cdH07XG5cblx0LyoqXG5cdCAqIGRyb3BoYW5kbGVyIGNhbGxzIHRoZSBkbmRIYW5kbGVyIGFsd2F5cyB3aGVubiBhIGZpbGUgZ2V0cyBkcm9wcGVkXG5cdCAqIEBwYXJhbSB7W29iamVjdF19IGV2ZW50IFtkcm9wRXZlbnQgd2hlcmUgdGhlIGZpbGVsaXN0IGlzIGJpbmRlZF1cblx0ICovXG5cdGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG5cdFx0dmFyIGZpbGVzID0gdXRpbHMudG9BcnJheShldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuXHRcdHNlbGYuY29udmVydEZpbGVzVG9CYXNlNjQoZmlsZXMpO1xuXHRcdHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG5cdH0pO1xuXG5cdC8qKlxuXHQgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG5cdCAqIEBwYXJhbSB7W29iamVjdF19IGV2ZW50IFtkcm9wRXZlbnQgd2hlcmUgdGhlIGZpbGVsaXN0IGlzIGJpbmRlZF1cblx0ICovXG5cdGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR1dGlscy5ub1Byb3BhZ2F0aW9uKGV2ZW50KTtcblx0XHR0aGlzLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xuXHR9KTtcblxuXHQvKipcblx0ICogVGhlIG90aGVyIGV2ZW50cyBhcmUgYWxzbyBoYW5kbGVkIGNhdXNlIHRoZXkgaGF2ZSB0byBiZVxuXHQgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG5cdCAqL1xuXHRkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR1dGlscy5ub1Byb3BhZ2F0aW9uKGV2ZW50KTtcblx0fSk7XG5cblx0LyoqXG5cdCAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcblx0ICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuXHQgKi9cblxuXHRkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG5cdFx0dGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcblx0fSk7XG5cblx0LyoqXG5cdCAqIElmIHRoZXJlIGlzIG5vIGZpbGVyZWFkZXIgYXZhaWxhYmxlLCB0aGVuIHRoZSBkcm9wem9uZSBzaG91bGQgbm90IGJlIGRpc3BsYXllZCBhbmQgdGhlIEZhbGxiYWNrIGlzIGRpc3BsYXllZFxuXHQgKi9cblx0aWYgKCF1dGlscy5oYXNGaWxlUmVhZGVyKCkgJiYgb3B0aW9ucy5mYWxsYmFja0ZvcklFOCApIHtcblx0XHRzZWxlY3RCdXR0b24uY2xhc3NOYW1lID0gJ3NlbGVjdGJ1dHRvbiBqc19zZWxlY3RidXR0b24nO1xuXG5cdFx0dmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cdFx0c3Bhbi5pbm5lckhUTUwgPSAnU2VsZWN0IEZpbGUnO1xuXG5cdFx0c2VsZWN0QnV0dG9uLmFwcGVuZENoaWxkKHNwYW4pO1xuXG5cdFx0c2VsZi5hZGRTZWxlY3RlZEZpbGUoKTtcblx0XHRkcm9wQm94LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb3JtRmlsZVVwbG9hZDtcblxuLyogZ2xvYmFsICQsIEZvcm1GaWxlVXBsb2FkICovXG5cblxuJC5mbi5mb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRyZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpbnN0YW5jZU9wdGlvbnM7XG5cblx0XHRpZiAoISQuZGF0YSh0aGlzLCAnZm9ybUZpbGVVcGxvYWQnKSkge1xuXHRcdFx0aW5zdGFuY2VPcHRpb25zID0gJC5leHRlbmQoe30sIG9wdGlvbnMsICQodGhpcykuZGF0YSgpKTtcblx0XHRcdCQuZGF0YSh0aGlzLCAnZm9ybUZpbGVVcGxvYWQnLCBuZXcgRm9ybUZpbGVVcGxvYWQodGhpcywgaW5zdGFuY2VPcHRpb25zKSk7XG5cdFx0fVxuXHR9KTtcbn07XG4iLCIvKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgRmlsZVJlYWRlciwgSW1hZ2UgKi9cblxuLyoqXG4gKiBbZXh0cmFjdERPTU5vZGVzIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgZXh0cmFjdERPTU5vZGVzID0gZnVuY3Rpb24ob2JqKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGlmKHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpe1xuXHRcdHJldHVybiBvYmpbMF07XG5cdH1cblxuXHRyZXR1cm4gb2JqO1xufTtcblxuLyoqXG4gKiBbdG9BcnJheSBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gb2JqZWN0IFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIHRvQXJyYXkgPSBmdW5jdGlvbihvYmplY3QpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iamVjdCwgMCk7XG59O1xuXG4vKipcbiAqIFtoYXNGaWxlUmVhZGVyIGRlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgaGFzRmlsZVJlYWRlciA9IGZ1bmN0aW9uKCkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRyZXR1cm4gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5GaWxlUmVhZGVyKTtcbn07XG5cbi8qKlxuICogW25vUHJvcGFnYXRpb24gZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIG5vUHJvcGFnYXRpb24gPSBmdW5jdGlvbihlKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cblx0aWYgKGUucHJldmVudERlZmF1bHQpIHtcblx0XHRyZXR1cm4gZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHR9IGVsc2Uge1xuXHRcdGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn07XG5cbi8qKlxuICogW21lcmdlT3B0aW9ucyBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gb3B0cyAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBkZWZhdWx0b3B0aW9ucyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIG1lcmdlT3B0aW9ucyA9IGZ1bmN0aW9uKG9wdHMsIGRlZmF1bHRPcHRpb25zLCBzZWxmKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBvcHRpb25zID0ge307XG5cblx0Zm9yICh2YXIgaSBpbiBkZWZhdWx0T3B0aW9ucykge1xuXG5cdFx0aWYob3B0cyAmJiBvcHRzLmhhc093blByb3BlcnR5KGkpKSB7XG5cblx0XHRcdG9wdGlvbnNbaV0gPSBvcHRzW2ldO1xuXG5cdFx0XHRpZiAodHlwZW9mKG9wdGlvbnNbaV0pID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRcdG9wdGlvbnNbaV0gPSBvcHRpb25zW2ldLmJpbmQoc2VsZik7XG5cdFx0XHR9XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0b3B0aW9uc1tpXSA9IGRlZmF1bHRPcHRpb25zW2ldO1xuXHRcdH1cblxuXHR9XG5cblx0cmV0dXJuIG9wdGlvbnM7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIEZpbGV0eXBlXG4gKiBAcGFyYW0gIHtbdHlwZV19IG5hdGl2ZUZpbGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGdldEZpbGVUeXBlID0gZnVuY3Rpb24gKGZpbGUpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0Ly8gRml4IGNocm9taXVtIGlzc3VlIDEwNTM4MjogRXhjZWwgKC54bHMpIEZpbGVSZWFkZXIgbWltZSB0eXBlIGlzIGVtcHR5LlxuXHRpZiAoKC9cXC54bHMkLykudGVzdChmaWxlLm5hbWUpICYmICFmaWxlLnR5cGUpIHtcblx0XHRyZXR1cm4gJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCc7XG5cdH1cblx0cmV0dXJuIGZpbGUudHlwZTtcbn07XG5cbi8qKlxuICogVGFrZXMgdGhlIG5hdGl2ZSBmaWxlc2l6ZSBpbiBieXRlcyBhbmQgcmV0dXJucyB0aGUgcHJldHRpZmllZCBmaWxlc2l6ZVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGUgW2NvbnRhaW5zIHRoZSBzaXplIG9mIHRoZSBmaWxlXVxuICogQHJldHVybiB7W3N0cmluZ119ICAgICAgW3ByZXR0aWZpZWQgZmlsZXNpemVdXG4gKi9cbnZhciBnZXRSZWFkYWJsZUZpbGVTaXplID0gZnVuY3Rpb24oZmlsZSkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgc2l6ZSA9IGZpbGUuc2l6ZTtcblx0dmFyIHN0cmluZztcblxuXHRpZiAoc2l6ZSA+PSAxMDI0ICogMTAyNCAqIDEwMjQgKiAxMDI0ICkge1xuXHRcdHNpemUgPSBzaXplIC8gKDEwMjQgKiAxMDI0ICogMTAyNCAqIDEwMjQgLyAxMCk7XG5cdFx0c3RyaW5nID0gJ1RCJztcblx0fSBlbHNlIGlmIChzaXplID49IDEwMjQgKiAxMDI0ICogMTAyNCApIHtcblx0XHRzaXplID0gc2l6ZSAvICgxMDI0ICogMTAyNCAqIDEwMjQgLyAxMCk7XG5cdFx0c3RyaW5nID0gJ0dCJztcblx0fSBlbHNlIGlmIChzaXplID49IDEwMjQgKiAxMDI0KSB7XG5cdFx0c2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgLyAxMCk7XG5cdFx0c3RyaW5nID0gJ01CJztcblx0fSBlbHNlIGlmIChzaXplID49IDEwMjQpIHtcblx0XHRzaXplID0gc2l6ZSAvICgxMDI0IC8gMTApO1xuXHRcdHN0cmluZyA9ICdLQic7XG5cdH0gZWxzZSB7XG5cdFx0c2l6ZSA9IHNpemUgKiAxMDtcblx0XHRzdHJpbmcgPSAnQic7XG5cdH1cblxuXHRyZXR1cm4gKE1hdGgucm91bmQoc2l6ZSkgLyAxMCkgKyAnICcgKyBzdHJpbmc7XG59O1xuXG4vKipcbiAqIFtpc0ltYWdlIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSAgZmlsZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGlzSW1hZ2UgPSBmdW5jdGlvbihmaWxlKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHJldHVybiAoL15pbWFnZVxcLy8pLnRlc3QoZ2V0RmlsZVR5cGUoZmlsZSkpO1xufTtcblxuLyoqXG4gKiBbaW5jcmVtZW50IHRoZSBmaWxlbnVtYmVyIGZvciBlYWNoIGRyb3BwZWQgZmlsZSBieSBvbmUgJiBpbmNyZW1lbnQgdGhlIHJlcXVlc3RzaXplIGJ5IHRoZSBjdXJyZW50IGZpbGVzaXplXVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGVcbiAqIEBwYXJhbSAge1tvYmplY3RdfSB0cmFja0RhdGFcbiAqL1xudmFyIHRyYWNrRmlsZSA9IGZ1bmN0aW9uKGZpbGUsIHRyYWNrRGF0YSkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR0cmFja0RhdGEuZmlsZU51bWJlciArPSAxO1xuXHR0cmFja0RhdGEucmVxdWVzdFNpemUgKz0gZmlsZS5zaXplO1xufTtcblxuLyoqXG4gKiBbZGVjcmVtZW50IHRoZSBmaWxlbnVtYmVyIGZvciBlYWNoIGRlbGV0ZWQgZmlsZSBieSBvbmUgJiBkZWNyZW1lbnQgdGhlIHJlcXVlc3RzaXplIGJ5IHRoZSBjdXJyZW50IGZpbGVzaXplXVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGVcbiAqIEBwYXJhbSAge1tvYmplY3RdfSB0cmFja0RhdGFcbiAqL1xudmFyIHVudHJhY2tGaWxlID0gZnVuY3Rpb24gKGZpbGUsIHRyYWNrRGF0YSkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0dHJhY2tEYXRhLmZpbGVOdW1iZXIgLT0gMTtcblx0dHJhY2tEYXRhLnJlcXVlc3RTaXplIC09IGZpbGUuc2l6ZTtcbn07XG5cbi8qKlxuICogW3JldHVybnMgdGhlIHByZXR0aWZpZWQgZmlsZXN0eXBlIHN0cmluZyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIG9wdGlvbnNdXG4gKiBAcGFyYW0gIHtbc3RyaW5nXX0gZmlsZVR5cGUgW21pbWV0eXBlIG9mIGZpbGVdXG4gKiBAcmV0dXJuIHtbc3RyaW5nXX0gICAgICBbcHJldHRpZmllZCB0eXBlc3RyaW5nXVxuICovXG52YXIgZ2V0UmVhZGFibGVGaWxlVHlwZSA9IGZ1bmN0aW9uIChmaWxlVHlwZSwgb3B0aW9ucykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRyZXR1cm4gb3B0aW9ucy5hY2NlcHRlZFR5cGVzW2ZpbGVUeXBlXSB8fCAndW5rbm93biBmaWxldHlwZSc7XG59O1xuXG52YXIgdmFsaWRhdGVGaWxlTnVtYmVyID0gZnVuY3Rpb24odHJhY2tEYXRhLCBvcHRpb25zKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGlmICh0cmFja0RhdGEuZmlsZU51bWJlciA+PSBvcHRpb25zLm1heEZpbGVOdW1iZXIpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG5cbnZhciB2YWxpZGF0ZVJlcXVlc3RTaXplID0gZnVuY3Rpb24ocmVxdWVzdFNpemUsIG9wdGlvbnMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0aWYgKHJlcXVlc3RTaXplID49IG9wdGlvbnMubWF4UmVxdWVzdFNpemUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG5cbnZhciB2YWxpZGF0ZUZpbGVUeXBlID0gZnVuY3Rpb24oZmlsZVR5cGUsIG9wdGlvbnMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0aWYgKCFvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHRydWU7XG59O1xuXG52YXIgdmFsaWRhdGVGaWxlU2l6ZSA9IGZ1bmN0aW9uKGZpbGUsIG9wdGlvbnMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0aWYgKGZpbGUuc2l6ZSA+IG9wdGlvbnMubWF4RmlsZVNpemUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG5cbnZhciB2YWxpZGF0ZUZpbGVOYW1lID0gZnVuY3Rpb24oZmlsZSwgb3B0aW9ucykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRpZiAoIShvcHRpb25zLmZpbGVOYW1lUmUpLnRlc3QoZmlsZS5uYW1lKSkge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXG5cdHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBbZGlzcGxheXMgdGhlIEVycm9yIG1lc3NhZ2UgJiByZW1vdmVzIGl0IGFsc28gYWZ0ZXIgdGhlIHNwZWNpZmllZCB0aW1lb3V0XVxuICogQHBhcmFtICB7W3N0cmluZ119IGVycm9yIFtlcnJvciBtZXNzYWdlIHdoaWNoIGhhcyB0byBiZSBkaXNwbGF5ZWRdXG4gKi9cbnZhciBzaG93RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24oZXJyb3IsIGVycm9yVGltZW91dElkLCByZW1vdmVFcnJvcnMsIGVycm9yV3JhcHBlciwgZm9ybSwgZmlsZVZpZXcsIG9wdGlvbnMpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGVycm9yRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cblx0ZXJyb3JFbGVtZW50LmNsYXNzTmFtZSA9ICdlcnJvcic7XG5cdGVycm9yRWxlbWVudC5pbm5lckhUTUwgPSBlcnJvcjtcblxuXHRjbGVhclRpbWVvdXQoZXJyb3JUaW1lb3V0SWQpO1xuXG5cdGVycm9yVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRyZW1vdmVFcnJvcnMoZXJyb3JXcmFwcGVyKTtcblx0fSwgb3B0aW9ucy5lcnJvck1lc3NhZ2VUaW1lb3V0KTtcblxuXHRlcnJvcldyYXBwZXIuYXBwZW5kQ2hpbGQoZXJyb3JFbGVtZW50KTtcblx0Zm9ybS5pbnNlcnRCZWZvcmUoZXJyb3JXcmFwcGVyLCBmaWxlVmlldyk7XG59O1xuXG4vKipcbiAqIFtyZW1vdmVzIGFsbCBlcnJvcnNdXG4gKi9cbnZhciByZW1vdmVFcnJvcnMgPSBmdW5jdGlvbihlcnJvcldyYXBwZXIpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXJyb3JXcmFwcGVyLmlubmVySFRNTCA9ICcnO1xufTtcblxuLyoqXG4gKiBbaWYgcG9zc2libGUgYWRkcyBhIHRodW1ibmFpbCBvZiB0aGUgZ2l2ZW4gZmlsZSB0byB0aGUgRE9NXVxuICogQHBhcmFtIHtbb2JqZWN0XX0gICAgIGZpbGUgICAgW2ZpbGVkYXRhIHRvIGNyZWF0ZSBhIHRodW1ibmFpbCB3aGljaCBnZXRzIGluamVjdGVkXVxuICogQHBhcmFtIHtbRE9NIG9iamVjdF19IGVsZW1lbnQgW0RPTSBlbGVtZW50IHRvIHNwZWNpZnkgd2hlcmUgdGhlIHRodW1ibmFpbCBoYXMgdG8gYmUgaW5qZWN0ZWRdXG4gKi9cbnZhciBhZGRUaHVtYm5haWwgPSBmdW5jdGlvbihmaWxlLCBlbGVtZW50LCBvcHRpb25zKXtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIEVNUFRZX0lNQUdFID0gJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQUVBQUFBQkFRTUFBQUFsMjFiS0FBQUFBMUJNVkVVQUFBQ25lajNhQUFBQUFYUlNUbE1BUU9iWVpnQUFBQXBKUkVGVUNOZGpZQUFBQUFJQUFlSWh2RE1BQUFBQVNVVk9SSzVDWUlJPSc7XG5cblx0dmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cdHZhciBmYWN0b3IgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcblx0dmFyIGltZ1dyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cblx0dmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXG5cdGNhbnZhcy53aWR0aCAgPSBvcHRpb25zLnRodW1ibmFpbFNpemUgKiBmYWN0b3I7XG5cdGNhbnZhcy5oZWlnaHQgPSBvcHRpb25zLnRodW1ibmFpbFNpemUgKiBmYWN0b3I7XG5cblx0dmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5cblx0aWYoZmFjdG9yID4gMSl7XG5cdFx0Y3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gPSBmYWN0b3I7XG5cdFx0Y3R4LnNjYWxlKGZhY3RvciwgZmFjdG9yKTtcblx0fVxuXG5cdHZhciBmaWxlTmFtZSA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmpzX25hbWUnKTtcblx0dmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG5cdGltZ1dyYXBwZXIuY2xhc3NOYW1lID0gJ3RodW1ibmFpbCc7XG5cblx0aW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHJhdGlvID0gdGhpcy5oZWlnaHQgLyB0aGlzLndpZHRoO1xuXG5cdFx0Y2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCAqIHJhdGlvO1xuXHRcdGN0eC5kcmF3SW1hZ2UodGhpcywgMCwgMCwgb3B0aW9ucy50aHVtYm5haWxTaXplLCBvcHRpb25zLnRodW1ibmFpbFNpemUgKiByYXRpbyk7XG5cdH0pO1xuXG5cdHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oZXZlbnQpe1xuXHRcdGlmIChpc0ltYWdlKGZpbGUpKSB7XG5cdFx0XHRpbWFnZS5zcmMgPSBldmVudC50YXJnZXQucmVzdWx0O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpbWFnZS5zcmMgPSBFTVBUWV9JTUFHRTtcblx0XHR9XG5cblx0XHRpbWdXcmFwcGVyLmFwcGVuZENoaWxkKGNhbnZhcyk7XG5cdFx0ZWxlbWVudC5pbnNlcnRCZWZvcmUoaW1nV3JhcHBlciwgZmlsZU5hbWUpO1xuXHR9KTtcblxuXHRyZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbn07XG5cbi8qKlxuICogW0NyZWF0ZXMgYSBsaXN0RWxlbWVudCB3aXRoIHRoZSBkYXRhIG9mIHRoZSBwYXNzZWQgb2JqZWN0XVxuICogQHBhcmFtICB7W3R5cGVdfSBmaWxlT2JqIFt1c2VkIHRvIHB1dCB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIGZpbGUgaW4gdGhlIGxpc3RFbGVtZW10XVxuICogQHJldHVybiB7W29iamVjdF19ICAgICAgIFt0aGUgbGlzdEVsZW1lbnQgd2hpY2ggZ2V0cyBpbmplY3RlZCBpbiB0aGUgRE9NXVxuICovXG52YXIgY3JlYXRlTGlzdEVsZW1lbnQgPSBmdW5jdGlvbihmaWxlTmFtZSwgZmlsZVNpemUsIGZpbGVUeXBlKXtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGZpbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0ZmlsZUVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZpbGUnO1xuXG5cdGZpbGVFbGVtZW50LmlubmVySFRNTCA9IFtcblx0JzxzcGFuIGNsYXNzPVwibGFiZWwganNfbmFtZSBuYW1lXCI+Jyxcblx0ZmlsZU5hbWUsXG5cdCc8L3NwYW4+PHNwYW4gY2xhc3M9XCJsYWJlbCBzaXplXCI+Jyxcblx0ZmlsZVNpemUsXG5cdCc8L3NwYW4+PHNwYW4gY2xhc3M9XCJsYWJlbCB0eXBlXCI+Jyxcblx0ZmlsZVR5cGUsXG5cdCc8L3NwYW4+J10uam9pbignJyk7XG5cblx0cmV0dXJuIGZpbGVFbGVtZW50O1xufTtcblxuLyoqXG4gKiBbQ3JlYXRlcyBhIGxpc3QgaXRlbSB3aGljaCBnZXRzIGluamVjdGVkIHRvIHRoZSBET01dXG4gKiBAcGFyYW0ge1tvYmplY3RdfSBmaWxlT2JqICAgICAgICAgICAgIFtmaWxlZGF0YSBmb3IgYWRkaW5nIHRoZSBmaWxlZGF0YSAmIHByZXZpZXcgdG8gdGhlIERPTV1cbiAqIEBwYXJhbSB7W2Z1bmN0aW9uXX0gcmVtb3ZlRmlsZUhhbmRsZXIgW2NhbGxiYWNrIGZvciBub3RpZnlpbmcgdGhhdCB0aGUgc3BlY2lmaWVkIGZpbGUgd2FzIGRlbGV0ZWRdXG4gKi9cbnZhciBhZGRGaWxlVG9WaWV3ID0gZnVuY3Rpb24oZmlsZU9iaiwgcmVtb3ZlRmlsZUhhbmRsZXJDYWxsYmFjaywgdHJhY2tEYXRhLCBmaWxlVmlldywgbGlzdEVsZW1lbnQpe1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvLyBBZGQgcmVtb3ZlIEVsZW1lbnQgJiByZWdpc3RlciByZW1vdmUgSGFuZGxlclxuXHR2YXIgcmVtb3ZlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXHRyZW1vdmVCdXR0b24uY2xhc3NOYW1lID0gJ3JlbW92ZSc7XG5cdGxpc3RFbGVtZW50LmFwcGVuZENoaWxkKHJlbW92ZUJ1dHRvbik7XG5cblx0ZmlsZVZpZXcuYXBwZW5kQ2hpbGQobGlzdEVsZW1lbnQpO1xuXG5cdHJlbW92ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuXG5cdFx0Ly8gY2FsbHMgdGhlIGNhbGxiYWNrIG9mIHRoZSBETkQgSGFuZGxlclxuXHRcdHJlbW92ZUZpbGVIYW5kbGVyQ2FsbGJhY2sodHJhY2tEYXRhKTtcblxuXHRcdC8vIHJlbW92ZSBmaWxlVmlld0VsZW1lbnRcblx0XHRsaXN0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpc3RFbGVtZW50KTtcblxuXHRcdHVudHJhY2tGaWxlKGZpbGVPYmouZmlsZSwgdHJhY2tEYXRhKTtcblx0fSk7XG59O1xuXG4vKipcbiAqIFtDcmVhdGVzIGEgaGlkZGVuIGlucHV0IGZpZWxkIHdoZXJlIHRoZSBiYXNlNjQgZGF0YSBpcyBzdG9yZWRdXG4gKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZU9iaiBbdGhlIGJhc2U2NCBzdHJpbmcgJiBhbGwgbWV0YWRhdGEgY29tYmluZWQgaW4gb25lIG9iamVjdF1cbiAqL1xudmFyIGFkZEJhc2U2NFRvRG9tID0gZnVuY3Rpb24oZmlsZU9iaiwgZm9ybSl7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcblxuXHRpbnB1dC50eXBlID0gXCJoaWRkZW5cIjtcblx0aW5wdXQudmFsdWUgPSBmaWxlT2JqLmRhdGE7XG5cdGlucHV0Lm5hbWUgPSAnZmlsZTonICsgZmlsZU9iai5maWxlLm5hbWU7XG5cblx0Zm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG5cblx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0aW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dCk7XG5cdH07XG59O1xuXG4vKipcbiAqIFtjcmVhdGVJbnB1dEVsZW1lbnQgZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGNyZWF0ZUlucHV0RWxlbWVudCA9IGZ1bmN0aW9uKGZpbGVJbnB1dElkKXtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIGZpbGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cblx0ZmlsZUlucHV0LnR5cGUgPSAnZmlsZSc7XG5cdGZpbGVJbnB1dC5jbGFzc05hbWUgPSAnZmlsZWlucHV0Jztcblx0ZmlsZUlucHV0SWQgKz0gMTtcblxuXHRmaWxlSW5wdXQubmFtZSA9ICdmaWxlSW5wdXQgJyArIGZpbGVJbnB1dElkO1xuXG5cdHJldHVybiBmaWxlSW5wdXQ7XG59O1xuXG5leHBvcnRzLmV4dHJhY3RET01Ob2RlcyAgICAgPSBleHRyYWN0RE9NTm9kZXM7XG5leHBvcnRzLnRvQXJyYXkgICAgICAgICAgICAgPSB0b0FycmF5O1xuZXhwb3J0cy5oYXNGaWxlUmVhZGVyICAgICAgID0gaGFzRmlsZVJlYWRlcjtcbmV4cG9ydHMubm9Qcm9wYWdhdGlvbiAgICAgICA9IG5vUHJvcGFnYXRpb247XG5leHBvcnRzLm1lcmdlT3B0aW9ucyAgICAgICAgPSBtZXJnZU9wdGlvbnM7XG5leHBvcnRzLmdldEZpbGVUeXBlICAgICAgICAgPSBnZXRGaWxlVHlwZTtcbmV4cG9ydHMuZ2V0UmVhZGFibGVGaWxlU2l6ZSA9IGdldFJlYWRhYmxlRmlsZVNpemU7XG5leHBvcnRzLmlzSW1hZ2UgICAgICAgICAgICAgPSBpc0ltYWdlO1xuZXhwb3J0cy5hZGRCYXNlNjRUb0RvbSAgICAgID0gYWRkQmFzZTY0VG9Eb207XG5leHBvcnRzLmNyZWF0ZUlucHV0RWxlbWVudCAgPSBjcmVhdGVJbnB1dEVsZW1lbnQ7XG5leHBvcnRzLnJlbW92ZUVycm9ycyAgICAgICAgPSByZW1vdmVFcnJvcnM7XG5leHBvcnRzLnRyYWNrRmlsZSAgICAgICAgICAgPSB0cmFja0ZpbGU7XG5leHBvcnRzLnVudHJhY2tGaWxlICAgICAgICAgPSB1bnRyYWNrRmlsZTtcbmV4cG9ydHMuZ2V0UmVhZGFibGVGaWxlVHlwZSA9IGdldFJlYWRhYmxlRmlsZVR5cGU7XG5leHBvcnRzLnZhbGlkYXRlRmlsZU51bWJlciAgPSB2YWxpZGF0ZUZpbGVOdW1iZXI7XG5leHBvcnRzLnZhbGlkYXRlUmVxdWVzdFNpemUgPSB2YWxpZGF0ZVJlcXVlc3RTaXplO1xuZXhwb3J0cy52YWxpZGF0ZUZpbGVUeXBlICAgID0gdmFsaWRhdGVGaWxlVHlwZTtcbmV4cG9ydHMudmFsaWRhdGVGaWxlU2l6ZSAgICA9IHZhbGlkYXRlRmlsZVNpemU7XG5leHBvcnRzLnZhbGlkYXRlRmlsZU5hbWUgICAgPSB2YWxpZGF0ZUZpbGVOYW1lO1xuZXhwb3J0cy5zaG93RXJyb3JNZXNzYWdlICAgID0gc2hvd0Vycm9yTWVzc2FnZTtcbmV4cG9ydHMuY3JlYXRlTGlzdEVsZW1lbnQgICA9IGNyZWF0ZUxpc3RFbGVtZW50O1xuZXhwb3J0cy5hZGRUaHVtYm5haWwgICAgICAgID0gYWRkVGh1bWJuYWlsO1xuZXhwb3J0cy5hZGRGaWxlVG9WaWV3ICAgICAgID0gYWRkRmlsZVRvVmlldztcbmV4cG9ydHMuYWRkQmFzZTY0VG9Eb20gICAgICA9IGFkZEJhc2U2NFRvRG9tO1xuZXhwb3J0cy5jcmVhdGVJbnB1dEVsZW1lbnQgID0gY3JlYXRlSW5wdXRFbGVtZW50O1xuIl19
