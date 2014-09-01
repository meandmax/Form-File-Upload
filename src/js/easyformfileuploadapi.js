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
	 * [getReadableFileType description]
	 * @param  {[type]} nativeFile [description]
	 * @return {[type]}            [description]
	 */
	getReadableFileType = function(nativeFile) {
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
