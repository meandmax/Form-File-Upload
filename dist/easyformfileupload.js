!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.EasyFormFileUpload=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * [EasyFormFileUpload description]
 * @param {[type]} $fileUpload [description]
 * @param {[type]} $fileSelect [description]
 * @param {[type]} $dropBox    [description]
 * @param {[type]} opts        [description]
 */
var easyFormFileUploadApi = function() {

	var fileNumber  = 0;
	var requestSize = 0;

	/**
	 * [extractDOMNodes description]
	 * @param  {[type]} obj [description]
	 * @return {[type]}     [description]
	 */
	extractDOMNodes = function(obj) {
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
	toArray = function(object) {
		return Array.prototype.slice.call(object, 0);
	};

	/**
	 * [hasFileReader description]
	 * @return {Boolean} [description]
	 */
	hasFileReader = function() {
		return !!(window.File && window.FileList && window.FileReader);
	};

	/**
	 * [noPropagation description]
	 * @param  {[type]} e [description]
	 * @return {[type]}   [description]
	 */
	noPropagation = function(e) {
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
	mergeOptions = function(opts, defaultOptions, self) {
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
	getFileType = function (nativeFile) {
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
	getReadableFileSize = function(nativeFile) {
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
	 * [getReadableFileType description]
	 * @param  {[type]} nativeFile [description]
	 * @return {[type]}            [description]
	 */
	getReadableFileType = function (nativeFile) {
		return options.acceptedTypes[getFileType(nativeFile)] || 'Unbekannt';
	};

	/**
	 * [isImage description]
	 * @param  {[type]}  nativeFile [description]
	 * @return {Boolean}            [description]
	 */
	isImage = function(nativeFile) {
		return (/^image\//).test(getFileType(nativeFile));
	};

	/* Next Task, reimplementing and testing*/

	trackFile = function (nativeFile) {
		fileNumber += 1;
		requestSize += nativeFile.size;
	};

	untrackFile = function (nativeFile) {
		fileNumber -= 1;
		requestSize -= nativeFile.size;
	};

	showErrorMessage = function (error) {
		clearTimeout(errorTimeoutId);

		errorTimeoutId = setTimeout(function () {
			removeErrors(true);
		}, ERROR_MESSAGE_TIMEOUT);

		$dropBox.after($('<li class="error">' + error + '<li>'));
	};

	removeErrors = function (fadeOut) {
		var $errors = $fileUpload.find('.error');

		if (fadeOut) {
			$errors.fadeOut(400, function () {
				$errors.remove();
			});
		} else {
			$errors.remove();
		}
	};

	/**
	 * [validateFile description]
	 * @param  {[type]} nativeFile [description]
	 * @return {[type]}            [description]
	 */
	validateFile = function(nativeFile) {
		var hasErrors = false;

		if (fileNumber >= options.maxFileNumber) {
			hasErrors = true;
			showErrorMessage(options.maxFileNumberError);
		}

		if (requestSize >= options.maxRequestSize) {
			hasErrors = true;
			showErrorMessage(options.maxRequestSizeError);
		}

		if (!options.acceptedTypes[getFileType(nativeFile)]) {
			hasErrors = true;
			showErrorMessage(options.invalidFileTypeError);
		}

		if (nativeFile.size > options.maxFileSize) {
			hasErrors = true;
			showErrorMessage(options.maxFileSizeError);
		}

		if (!(/^[A-Za-z0-9.\-_ ]+$/).test(nativeFile.name)) {
			hasErrors = true;
			showErrorMessage(invalidFileNameError);
		}

		return !hasErrors;
	};

	//Reimplementing in vanilla
	addhiddenInputToDOM = function(base64File) {
		// var $hiddenDataField = $('<input type="hidden">');
		// $hiddenDataField.val(base64File.base64);
		// $hiddenDataField.attr('name', 'file:' + base64File.name);
		// $hiddenDataField.appendTo($fileInputs);
	};


};

module.exports = easyFormFileUploadApi;

},{}],2:[function(_dereq_,module,exports){
var easyFormFileUploadApi = _dereq_('./easyformfileuploadapi.js');

var EasyFormFileUpload = function(fileUpload, fileSelect, dropBox, opts){

	easyFormFileUploadApi();

	var fileUpload = extractDOMNodes(fileUpload);
	var fileSelect = extractDOMNodes(fileSelect);
	var dropBox    = extractDOMNodes(dropBox);
	var fileView   = document.querySelector('.js_list');
	var fileInputs = document.querySelector('.js_fileinputs');

	var self        = this;

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

	var options = mergeOptions(opts, defaultOptions, self);

	// var convertToBase64File = function (nativeFile, callback) {
	// 	var deferred = $.Deferred();
	// 	var reader = new FileReader();

	// 	reader.onload = function (event) {
	// 		callback(null, data)

	// 		deferred.resolve({
	// 			data: event.target.result,
	// 			nativeFile : nativeFile
	// 		});
	// 	};

	// 	reader.onerror = function(){
	// 		deferred.reject(this);
	// 	};

	// 	reader.readAsDataURL(nativeFile);

	// 	return deferred.promise();
	// };

	// var parseBase64Files = function (nativeFiles) {
	// 	return $.when.apply(null, nativeFiles.map(function (nativeFile) {
	// 		return convertToBase64File(nativeFile);
	// 	})).then(function () {
	// 		return toArray(arguments);
	// 	});
	// };
	// var showErrorMessage = function (error) {
	// 	clearTimeout(errorTimeoutId);

	// 	errorTimeoutId = setTimeout(function () {
	// 		removeErrors(true);
	// 	}, ERROR_MESSAGE_TIMEOUT);

	// 	$dropBox.after($('<li class="error">' + error + '<li>'));
	// };
	// var addFilePreview = function(nativeFile, $fileViewElement) {
	// 	var reader = new FileReader();

	// 	var $imgWrapper = $('<span class="thumbnail"></span>');

	// 	if(!!options.circleThumbnail){
	// 		$imgWrapper.addClass('circle');
	// 	}

	// 	reader.onload = function (event) {
	// 		var image = new Image();

	// 		if (isImage(nativeFile)) {
	// 			image.src = event.target.result;
	// 		} else {
	// 			image.src = EMPTY_IMAGE;
	// 		}

	// 		$fileViewElement.prepend($imgWrapper.append(image));
	// 	};

	// 	reader.readAsDataURL(nativeFile);
	// };

	// var addFileToView = function(nativeFile, removeHandler) {
	// 	var fileSize = getReadableFileSize(nativeFile);
	// 	var fileType = getReadableFileType(nativeFile);

	// 	var $fileViewElement = $('<li class="file"></li>');

	// 	$fileViewElement.append([
	// 		'<span class="label name">',
	// 		nativeFile.name,
	// 		'</span><span class="label size">',
	// 		fileSize,
	// 		'</span><span class="label type">',
	// 		fileType,
	// 		'</span>'
	// 	].join(''));

	// 	var $removeButton = $('<span/>');

	// 	$fileViewElement.append($removeButton);

	// 	$removeButton.addClass('remove');

	// 	$removeButton.on('click', function () {
	// 		$fileViewElement.remove();

	// 		removeHandler();
	// 	});

	// 	if (hasFileReader) {
	// 		addFilePreview(nativeFile, $fileViewElement);
	// 	}

	// 	$fileView.append($fileViewElement);
	// };
	// var fileInputId = 0;

	// var addNewFileInput = function () {
	// 	var $fileInput = $('<input/>');

	// 	fileInputId += 1;

	// 	$fileInput.attr('name', 'fileInput' + fileInputId);
	// 	$fileInput.attr('type', 'file');
	// 	$fileInput.addClass('fileinput');

	// 	$fileSelect.prepend($fileInput);

	// 	$fileInput.on('change', function () {
	// 		removeErrors(false);

	// 		var nativeFiles = toArray($(this).prop('files'));

	// 		if (!nativeFiles.length) {
	// 			return;
	// 		}

	// 		var nativeFile = nativeFiles[0];

	// 		if (!validateFile(nativeFile)) {
	// 			$fileInput.remove();
	// 		} else {
	// 			trackFile(nativeFile);

	// 			$fileInput.appendTo($fileInputs);

	// 			addFileToView(nativeFile, function () {
	// 				untrackFile(nativeFile);

	// 				$fileInput.remove();
	// 			});
	// 		}

	// 		addNewFileInput();
	// 	});
	// };

	// addNewFileInput();

	// var createDndHandler = function (event) {
	// 	removeErrors(false);

	// 	var nativeFiles = toArray(event.originalEvent.dataTransfer.files);

	// 	parseBase64Files(nativeFiles).done(function (base64Files) {
	// 		base64Files.every(function (base64File) {
	// 			var nativeFile = base64File.nativeFile;

	// 			if (!validateFile(nativeFile)) {
	// 				return false;
	// 			}


	// 			trackFile(nativeFile);

	// 			var $hiddenDataField = $('<input type="hidden">');

	// 			$hiddenDataField.val(base64File.data);
	// 			$hiddenDataField.attr('name', 'file:' + nativeFile.name);
	// 			$hiddenDataField.appendTo($fileInputs);

	// 			addFileToView(nativeFile, function () {
	// 				untrackFile(nativeFile);

	// 				$hiddenDataField.remove();
	// 			});

	// 			return true;
	// 		});
	// 	});
	// };

	dropBox.addEventListener('drop', function(event) {
		noPropagation(event);
		// $(this).removeClass('active');
		dndHandler(event);
	});

	dropBox.addEventListener('dragenter', function(event) {
		noPropagation(event);
	});

	dropBox.addEventListener('dragover', function(event) {
		noPropagation(event);
		// $(this).addClass('active');
	});

	dropBox.addEventListener('dragleave', function(event) {
		noPropagation(event);
		// $(this).removeClass('active');
	});

	if (!hasFileReader()) {
		// dropBox.hide();
	}
};

module.exports = EasyFormFileUpload;

},{"./easyformfileuploadapi.js":1}]},{},[2])
(2)
});