(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var utils    = require('./formfileuploadutils.js');

var FormFileUpload = function(fileUpload_, opts){

	var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

	var errorTimeoutId;
	var fileInputId = 0;

	var trackData = {
		fileNumber: 0,
		requestSize: 0
	};

	var self         = this;
	var fileUpload   = utils.extractDOMNodes(fileUpload_);
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
				utils.showErrorMessage(validateFile(file), options.errorTimeoutId, utils.removeErrors, errorWrapper, form, fileView, options);
				return false;
			}

			utils.trackFile(file, trackData);

			reader.addEventListener('load', function(event) {
				convertBase64FileHandler(null, {
					data: event.target.result,
					file: file
				});
			});

			reader.addEventListener('error', function(event) {
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

$.fn.formFileUpload = function(options) {
	return this.each(function() {
		var instanceOptions;

		if (!$.data(this, 'formFileUpload')) {
			instanceOptions = $.extend({}, options, $(this).data());
			$.data(this, 'formFileUpload', new FormFileUpload(this, instanceOptions));
		}
	});
};

},{"./formfileuploadutils.js":2}],2:[function(require,module,exports){
/**
 * [extractDOMNodes description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
var extractDOMNodes = function(obj) {
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
	return Array.prototype.slice.call(object, 0);
};

/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function() {
	return !!(window.File && window.FileList && window.FileReader);
};

/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
var noPropagation = function(e) {
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
	var options = {};
	for (var i in defaultOptions) {
		if(opts && opts.hasOwnProperty(i)) {
			options[i] = opts[i];
			if (typeof(options[i]) === 'function') {
				options[i] = options[i].bind(self);
			}
		} else{
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
	return (/^image\//).test(getFileType(file));
};

/**
 * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var trackFile = function(file, trackData) {
	trackData.fileNumber += 1;
	trackData.requestSize += file.size;
};

/**
 * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var untrackFile = function (file, trackData) {
	trackData.fileNumber -= 1;
	trackData.requestSize -= file.size;
};

/**
 * [returns the prettified filestype string based on the specified options]
 * @param  {[string]} fileType [mimetype of file]
 * @return {[string]}      [prettified typestring]
 */
var getReadableFileType = function (fileType, options) {
	return options.acceptedTypes[fileType] || 'unknown filetype';
};

var validateFileNumber = function(trackData, options) {
	if (trackData.fileNumber >= options.maxFileNumber) {
		return false;
	}
	return true;
};

var validateRequestSize = function(requestSize, options) {
	if (requestSize >= options.maxRequestSize) {
		return false;
	}
	return true;
};

var validateFileType = function(fileType, options) {
	if (!options.acceptedTypes[fileType]) {
		return false;
	}
	return true;
};

var validateFileSize = function(file, options) {
	if (file.size > options.maxFileSize) {
		return false;
	}
	return true;
};

var validateFileName = function(file, options) {
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
	var errors = document.querySelectorAll('.error');
	errorWrapper.innerHTML = '';
};

/**
 * [if possible adds a thumbnail of the given file to the DOM]
 * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
 * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
 */
var addThumbnail = function(file, element, options){
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

	image.addEventListener('load', function(event){
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

	// Add remove Element & register remove Handler
	var removeButton = document.createElement('span');
	removeButton.className = 'remove';
	listElement.appendChild(removeButton);

	fileView.appendChild(listElement);

	removeButton.addEventListener('click', function(event) {

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
	var input = document.createElement("input");
	input.type = "hidden";
	input.value = fileObj.data;
	input.name = 'file:' + fileObj.file.name;
	form.appendChild(input);

	return function(file, trackData){
		input.parentNode.removeChild(input);
	};
};

/**
 * [createInputElement description]
 * @return {[type]} [description]
 */
var createInputElement = function(fileInputId){
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