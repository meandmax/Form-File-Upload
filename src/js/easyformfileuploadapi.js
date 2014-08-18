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
