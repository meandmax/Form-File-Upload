!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.EasyFileUpload=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){


/**
 * [EasyFormFileUpload description]
 * @param {[type]} $fileUpload [description]
 * @param {[type]} $fileSelect [description]
 * @param {[type]} $dropBox    [description]
 * @param {[type]} opts        [description]
 */
var easyFormFileUploadApi = function() {

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

	// /**
	//  * [mergeOptions description]
	//  * @param  {[type]} opts           [description]
	//  * @param  {[type]} defaultoptions [description]
	//  * @return {[type]}                [description]
	//  */
	// mergeOptions = function(opts, defaultoptions) {
	// 	for (var i in defaultOptions) {
	// 		if(opts && opts.hasOwnProperty(i)) {
	// 			options[i] = opts[i];
	// 			if (typeof(options[i]) === 'function') {
	// 				options[i] = options[i].bind(self);
	// 			}
	// 		} else{
	// 			options[i] = defaultOptions[i];
	// 		}
	// 	}
	// }.bind(self);

	// /**
	//  * Returns the Filetype
	//  * @param  {[type]} nativeFile [description]
	//  * @return {[type]}            [description]
	//  */
	// getFileType = function (nativeFile) {
	// 	// Fix chromium issue 105382: Excel (.xls) FileReader mime type is empty.
	// 	if ((/\.xls$/).test(nativeFile.name) && !nativeFile.type) {
	// 		return 'application/vnd.ms-excel';
	// 	}
	// 	return nativeFile.type;
	// };

	// /**
	//  * Takes the native filesize in bytes and returns the prettified filesize
	//  * @param  {[type]} nativeFile [description]
	//  * @return {[type]}            [description]
	//  */
	// getReadableFileSize = function(nativeFile) {
	// 	var size = nativeFile.size;
	// 	var string;

	// 	if (size >= 1024 * 1024 * 1024 * 1024 ) {
	// 		size = size / (1024 * 1024 * 1024 * 1024 / 10);
	// 		string = 'TB';
	// 	} else if (size >= 1024 * 1024 * 1024 ) {
	// 		size = size / (1024 * 1024 * 1024 / 10);
	// 		string = 'GB';
	// 	} else if (size >= 1024 * 1024) {
	// 		size = size / (1024 * 1024 / 10);
	// 		string = 'MB';
	// 	} else if (size >= 1024) {
	// 		size = size / (1024 / 10);
	// 		string = 'kB';
	// 	} else {
	// 		size = size * 10;
	// 		string = 'B';
	// 	}

	// 	return (Math.round(size) / 10) + ' ' + string;
	// };

	// /**
	//  * [getReadableFileType description]
	//  * @param  {[type]} nativeFile [description]
	//  * @return {[type]}            [description]
	//  */
	// getReadableFileType = function (nativeFile) {
	// 	return options.acceptedTypes[getFileType(nativeFile)] || 'Unbekannt';
	// };

	// isImage = function(nativeFile) {
	// 	return (/^image\//).test(getFileType(nativeFile));
	// };

	// convertToBase64File = function (nativeFile) {
	// 	var deferred = $.Deferred();
	// 	var reader = new FileReader();

	// 	reader.onload = function (event) {
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

	// parseBase64Files = function (nativeFiles) {
	// 	return $.when.apply(null, nativeFiles.map(function (nativeFile) {
	// 		return convertToBase64File(nativeFile);
	// 	})).then(function () {
	// 		return toArray(arguments);
	// 	});
	// };

	// trackFile = function (nativeFile) {
	// 	fileNumber += 1;
	// 	requestSize += nativeFile.size;
	// };

	// untrackFile = function (nativeFile) {
	// 	fileNumber -= 1;
	// 	requestSize -= nativeFile.size;
	// };

	// removeErrors = function (fadeOut) {
	// 	var $errors = $fileUpload.find('.error');

	// 	if (fadeOut) {
	// 		$errors.fadeOut(400, function () {
	// 			$errors.remove();
	// 		});
	// 	} else {
	// 		$errors.remove();
	// 	}
	// };

	// var errorTimeoutId;

	// showErrorMessage = function (error) {
	// 	clearTimeout(errorTimeoutId);

	// 	errorTimeoutId = setTimeout(function () {
	// 		removeErrors(true);
	// 	}, ERROR_MESSAGE_TIMEOUT);

	// 	$dropBox.after($('<li class="error">' + error + '<li>'));
	// };

	// validateFile = function(nativeFile) {
	// 	var hasErrors = false;

	// 	if (fileNumber >= options.maxFileNumber) {
	// 		hasErrors = true;
	// 		showErrorMessage(options.maxFileNumberError);
	// 	}

	// 	if (requestSize >= options.maxRequestSize) {
	// 		hasErrors = true;
	// 		showErrorMessage(options.maxRequestSizeError);
	// 	}

	// 	if (!options.acceptedTypes[getFileType(nativeFile)]) {
	// 		hasErrors = true;
	// 		showErrorMessage(options.invalidFileTypeError);
	// 	}

	// 	if (nativeFile.size > options.maxFileSize) {
	// 		hasErrors = true;
	// 		showErrorMessage(options.maxFileSizeError);
	// 	}

	// 	if (!(/^[A-Za-z0-9.\-_ ]+$/).test(nativeFile.name)) {
	// 		hasErrors = true;
	// 		showErrorMessage(invalidFileNameError);
	// 	}

	// 	return !hasErrors;
	// };

	// addFilePreview = function(nativeFile, $fileViewElement) {
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

	// addFileToView = function(nativeFile, removeHandler) {
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

	// addNewFileInput = function () {
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

	// createDndHandler = function (event) {
	// 	removeErrors(false);

	// 	var nativeFiles = toArray(event.originalEvent.dataTransfer.files);

	// 	parseBase64Files(nativeFiles).done(function (base64Files) {
	// 		base64Files.every(function (base64File) {
	// 			var nativeFile = base64File.nativeFile;

	// 			if (!validateFile(nativeFile)) {
	// 				return false;
	// 			}

	// 			debuggger;

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

	// $dropBox.on('drop', function(event) {
	// 	noPropagation(event);
	// 	$(this).removeClass('active');
	// 	createDndHandler(event);
	// });

	// $dropBox.on('dragenter', function(event) {
	// 	noPropagation(event);
	// });

	// $dropBox.on('dragover', function(event) {
	// 	noPropagation(event);
	// 	$(this).addClass('active');
	// });

	// $dropBox.on('dragleave', function(event) {
	// 	noPropagation(event);
	// 	$(this).removeClass('active');
	// });

	// if (!hasFileReader) {
	// 	$dropBox.hide();
	// }
};

module.exports = easyFormFileUploadApi;


},{}]},{},[1])
(1)
});