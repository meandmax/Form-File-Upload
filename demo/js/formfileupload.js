!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.FormFileUpload=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var helper = _dereq_('./helper.js');

var FormFileUpload = function(fileUpload_, dropBox_, opts){

	var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

	var errorTimeoutId;
	var fileInputId = 0;
	var fileNumber  = 0;
	var requestSize = 0;

	var self         = this;
	var fileUpload   = helper.extractDOMNodes(fileUpload_);
	var dropBox      = helper.extractDOMNodes(dropBox_);
	var fileView     = document.querySelector('.js_list');
	var fileInputs   = document.querySelector('.js_fileinputs');
	var form         = document.querySelector('.js_form');
	var errorWrapper = document.createElement('div');

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
		 * [defines if the thumbails are displayed in circles, otherwise rectangles]
		 * @type {Boolean}
		 */
		circleThumbnail: false,

		/**
		 * [defines the maximum size of each request in bytes]
		 * @type {Number}
		 */
		maxRequestSize: 9437184,

		/**
		 * [errormessage displayed when the file has characters which are not allowed]
		 * @type {String}
		 */
		invalidFileNameError: 'Der Dateiname enthält ungültige Zeichen.',

		/**
		 * [errormessage displayed when the filetype is not allowed]
		 * @type {String}
		 */
		invalidFileTypeError: 'Ein Dateiformat ist nicht zugelassen. Bitte wählen sie ein anderes Dateiformat.',

		/**
		 * [errormessage displayed when the max. requestsize is reached]
		 * @type {String}
		 */
		maxRequestSizeError: 'Das Datenlimit für den Upload von Dateien ist überschritten.',

		/**
		 * [errormessage displayed when the max. filenumber is reached]
		 * @type {String}
		 */
		maxFileNumberError: 'Sie können nur maximal 3 Dateien anhängen.',

		/**
		 * [errormessage displayed when the max. filensize is reached]
		 * @type {String}
		 */
		maxFileSizeError: 'Eine Datei ist zu groß. Maximal 3 MB pro Datei sind zugelassen.',

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
	var options = helper.mergeOptions(opts, defaultOptions, self);

	/**
	 * [validateFile description]
	 * @param  {[object]}  file
	 * @return {[boolean]} [is true if the file is valid and the request is also valid]
	 */
	var validateFile = function(file) {
		var hasErrors = false;

		if (fileNumber >= options.maxFileNumber) {
			hasErrors = true;
			showErrorMessage(options.maxFileNumberError);
		}

		if (requestSize >= options.maxRequestSize) {
			hasErrors = true;
			showErrorMessage(options.maxRequestSizeError);
		}

		if (!options.acceptedTypes[helper.getFileType(file)]) {
			hasErrors = true;
			showErrorMessage(options.invalidFileTypeError);
		}

		if (file.size > options.maxFileSize) {
			hasErrors = true;
			showErrorMessage(options.maxFileSizeError);
		}

		if (!(/^[A-Za-z0-9.\-_ ]+$/).test(file.name)) {
			hasErrors = true;
			showErrorMessage(invalidFileNameError);
		}

		return !hasErrors;
	};

	/**
	 * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
	 * @param {[object]} file
	 */
	var trackFile = function (file) {
		fileNumber += 1;
		requestSize += file.size;
	};

	/**
	 * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
	 * @param  {[type]} file
	 */
	var untrackFile = function (file) {
		fileNumber -= 1;
		requestSize -= file.size;
	};

	/**
	 * [displays the Error message & removes it also after the specified timeout]
	 * @param  {[string]} error [error message which has to be displayed]
	 */
	var showErrorMessage = function (error) {

		clearTimeout(errorTimeoutId);

		errorTimeoutId = setTimeout(function () {
			removeErrors();
		}, errorMessageTimeout);

		var errorElement = document.createElement('li');

		errorElement.className = 'error';

		errorElement.innerHTML = error;
		errorWrapper.appendChild(errorElement);

		form.insertBefore(errorWrapper, fileView);
	};

	/**
	 * [removes all errors]
	 */
	var removeErrors = function () {
		var errors = document.querySelectorAll('.error');
		errorWrapper.innerHTML = '';
	};

	/**
	 * [returns the prettified filestype string based on the specified options]
	 * @param  {[object]} file [fileobject with mimetye]
	 * @return {[string]}      [prettified typestring]
	 */
	var getReadableFileType = function (file) {
		return options.acceptedTypes[helper.getFileType(file)] || 'Unbekannt';
	};

	/**
	 * [if possible adds a thumbnail of the given file to the DOM]
	 * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
	 * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
	 */
	var addThumbnail = function(file, element){
		var reader = new FileReader();
		var imgWrapper = document.createElement('span');
		var fileName = element.querySelector('.js_name');
		imgWrapper.className = 'thumbnail';

		if(!!options.circleThumbnail){
			imgWrapper.className += ' circle';
		}

		reader.onload = function (event) {
			var image = new Image();

			if (helper.isImage(file)) {
				image.src = event.target.result;
			} else {
				image.src = EMPTY_IMAGE;
			}

			imgWrapper.appendChild(image);
			element.insertBefore(imgWrapper, fileName);
		};

		reader.readAsDataURL(file);

	};

	/**
	 * [Creates a list item which gets injected to the DOM]
	 * @param {[object]} fileObj             [filedata for adding the filedata & preview to the DOM]
	 * @param {[function]} removeFileHandler [callback for notifying that the specified file was deleted]
	 */
	var addFileToView = function(fileObj, removeFileHandlerCallback){
		var fileSize = helper.getReadableFileSize(fileObj.file);
		var fileType = getReadableFileType(fileObj.file);

		var fileElement = document.createElement('li');

		fileElement.className = 'file';

		fileElement.innerHTML = [
		'<span class="label js_name name">',
		fileObj.file.name,
		'</span><span class="label size">',
		fileSize,
		'</span><span class="label type">',
		fileType,
		'</span>'].join('');

		if (helper.hasFileReader) {
			addThumbnail(fileObj.file, fileElement);
		}

		// Add remove Element & register remove Handler
		var removeButton = document.createElement('span');
		removeButton.className = 'remove';
		fileElement.appendChild(removeButton);

		fileView.appendChild(fileElement);

		removeButton.addEventListener('click', function(event) {

			// calls the callback of the DND Handler
			removeFileHandlerCallback();

			// remove fileViewElement
			fileElement.remove();

			untrackFile(fileObj.file);
		});
	};


	/**
	 * [Creates a hidden input field where the base64 data is stored]
	 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
	 */
	var addBase64ToDom = function(fileObj){
		var input = document.createElement("input");
		input.type = "hidden";
		input.value = fileObj.data;
		input.name = 'file: ' + fileObj.file.name;
		fileUpload.appendChild(input);
		addFileToView(fileObj, function(){
			//remove hidden input
			input.remove();
		});
	};

	/**
	 * Callback function for handling the async filereader response
	 * @param  {[string]} err     [the errormessage which gets thrown when the filereader errored]
	 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
	 */
	var convertBase64FileHandler = function(err, fileObj){
		if (err) {
			console.log(err);
		}

		if (fileObj) {
			addBase64ToDom(fileObj);
		}
	};

	/**
	 * [converts the filedata into a base64 string and validates the filedata]
	 * @param  {[array]}    files                    [the converted fileListObject]
	 * @param  {[function]} convertBase64FileHandler [gets called when the reader had converted the filedata successfully]
	 */
	var convertFilesToBase64 = function(files, convertBase64FileHandler){
		files.every(function(file) {
			var reader = new FileReader();

			if(!validateFile(file)){
				return false;
			}

			reader.onload = function (event) {
				convertBase64FileHandler(null, {
					data: event.target.result,
					file: file
				});
				trackFile(file);
			};

			reader.onerror = function(){
				convertBase64FileHandler('Error while loading the file');
			};

			reader.readAsDataURL(file);

			return true;
		});
	};

	/**
	 * The dndHandler function is the only function which is publicly exposed
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	this.dndHandler = function(event){
		var files = helper.toArray(event.dataTransfer.files);
		convertFilesToBase64(files, convertBase64FileHandler);
	};

	/**
	 * drophandler calls the dndHandler always whenn a file gets dropped
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('drop', function(event) {
		helper.noPropagation(event);
		self.dndHandler(event);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragenter', function(event) {
		helper.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragover', function(event) {
		helper.noPropagation(event);
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */

	dropBox.addEventListener('dragleave', function(event) {
		helper.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * If there is no filereader available, then the dropzone should not be displayed
	 */
	if (!helper.hasFileReader()) {
		dropBox.hide();
	}
};

module.exports = FormFileUpload;

},{"./helper.js":2}],2:[function(_dereq_,module,exports){
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
var getFileType = function (nativeFile) {
	// Fix chromium issue 105382: Excel (.xls) FileReader mime type is empty.
	if ((/\.xls$/).test(nativeFile.name) && !nativeFile.type) {
		return 'application/vnd.ms-excel';
	}
	return nativeFile.type;
};

/**
 * Takes the native filesize in bytes and returns the prettified filesize
 * @param  {[type]} nativeFile [description]
 * @return {[type]}            [description]
 */
var getReadableFileSize = function(nativeFile) {
	var size = nativeFile.size;
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

exports.extractDOMNodes     = extractDOMNodes;
exports.toArray             = toArray;
exports.hasFileReader       = hasFileReader;
exports.noPropagation       = noPropagation;
exports.mergeOptions        = mergeOptions;
exports.getFileType         = getFileType;
exports.getReadableFileSize = getReadableFileSize;
exports.isImage             = isImage;

},{}]},{},[1])
(1)
});