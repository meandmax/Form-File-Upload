!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.EasyFormFileUpload=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var helper = _dereq_('./helper.js');

var EasyFormFileUpload = function(fileUpload, fileSelect, dropBox, opts){
	var self        = this;
	var fileUpload  = helper.extractDOMNodes(fileUpload);
	var fileSelect  = helper.extractDOMNodes(fileSelect);
	var dropBox     = helper.extractDOMNodes(dropBox);
	var fileView    = document.querySelector('.js_list');
	var fileInputs  = document.querySelector('.js_fileinputs');
	var fileInputId = 0;

	var defaultOptions = {

		/**
		 * [emptyImage description]
		 * @type {String}
		 */
		emptyImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=',

		/**
		 * [errorMessageTimeout description]
		 * @type {Number}
		 */
		errorMessageTimeout: 5000,

		/**
		 * [maxFileSize description]
		 * @type {Number}
		 */
		maxFileSize: 3145728,

		/**
		 * [maxFileNumber description]
		 * @type {Number}
		 */
		maxFileNumber: 3,

		/**
		 * [roundedThumbnail description]
		 * @type {Boolean}
		 */
		circleThumbnail: false,

		/**
		 * [maxRequestSize description]
		 * @type {Number}
		 */
		maxRequestSize: 9437184,

		/**
		 * [invalidFileNameError description]
		 * @type {String}
		 */
		invalidFileNameError: 'Der Dateiname enthält ungültige Zeichen.',

		/**
		 * [invalidFileTypeError description]
		 * @type {String}
		 */
		invalidFileTypeError: 'Ein Dateiformat ist nicht zugelassen. Bitte wählen sie ein anderes Dateiformat.',

		/**
		 * [maxRequestSizeError description]
		 * @type {String}
		 */
		maxRequestSizeError: 'Das Datenlimit für den Upload von Dateien ist überschritten.',

		/**
		 * [maxFileNumberError description]
		 * @type {String}
		 */
		maxFileNumberError: 'Sie können nur maximal 3 Dateien anhängen.',

		/**
		 * [maxFileSizeError description]
		 * @type {String}
		 */
		maxFileSizeError: 'Eine Datei ist zu groß. Maximal 3 MB pro Datei sind zugelassen.',

		/**
		 * [acceptedTypes description]
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

	var options = helper.mergeOptions(opts, defaultOptions, self);

	/**
	 * [getReadableFileType description]
	 * @param  {[type]} nativeFile [description]
	 * @return {[type]}            [description]
	 */
	var getReadableFileType = function (file) {
		return options.acceptedTypes[helper.getFileType(file)] || 'Unbekannt';
	};

	var removeFileHandler = function(){};

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

	var addFileToView = function(fileObj, removeFileHandler){
		var fileSize = helper.getReadableFileSize(fileObj.file);
		var fileType = getReadableFileType(fileObj.file);

		var fileElement = document.createElement('li');

		fileElement.className = 'file';

		fileElement.innerHTML = '<span class="label js_name name">'
		+ fileObj.file.name + '</span><span class="label size">'
		+ fileSize + '</span><span class="label type">' + fileType + '</span>';


		if (helper.hasFileReader) {
			addThumbnail(fileObj.file, fileElement);
		}

		fileView.appendChild(fileElement);

		// Add remove Element & register remove Handler
		var removeButton = document.createElement('span');
		removeButton.className = 'remove';

		removeButton.addEventListener('click', function(event) {
			removeFileHandler();
			fileElement.remove();
		});
	};

	var addBase64ToDom = function(fileObj){
		var input = document.createElement("input");
		input.type = "hidden";
		input.value = fileObj.data;
		input.name = 'file: ' + fileObj.file.name;
		fileUpload.appendChild(input);
		addFileToView(fileObj, removeFileHandler);
	};

	var convertBase64FileHandler = function(err, fileObj){
		if (err) {
			console.log(err);
		}

		if (fileObj) {
			addBase64ToDom(fileObj);
		}
	};

	var convertFilesToBase64 = function(files, convertBase64FileHandler){
		files.forEach(function(file) {
			var reader = new FileReader();
			reader.onload = function (event) {
				convertBase64FileHandler(null, {
					data: event.target.result,
					file: file
				});
			};

			reader.onerror = function(){
				convertBase64FileHandler('Error while loading the file');
			};

			reader.readAsDataURL(file);
		})
	};

	var dndHandler = function(event){
		var files = helper.toArray(event.dataTransfer.files);
		convertFilesToBase64(files, convertBase64FileHandler);
	};

	dropBox.addEventListener('drop', function(event) {
		helper.noPropagation(event);
		$(this).removeClass('active');
		dndHandler(event);
	});

	dropBox.addEventListener('dragenter', function(event) {
		helper.noPropagation(event);
	});

	dropBox.addEventListener('dragover', function(event) {
		helper.noPropagation(event);
		$(this).addClass('active');
	});

	dropBox.addEventListener('dragleave', function(event) {
		helper.noPropagation(event);
		$(this).removeClass('active');
	});

	if (!helper.hasFileReader()) {
		dropBox.hide();
	}
};

module.exports = EasyFormFileUpload;

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
		return e.returnValue = false;
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
isImage = function(file) {
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