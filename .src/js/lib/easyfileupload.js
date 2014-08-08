var EasyFileUpload = function($fileUpload, url, opts) {
	var $selectButton = $fileUpload.find('.js_selectfile');
	var $dropBox      = $fileUpload.find('.js_dropbox');
	var $fileView     = $fileUpload.find('.js_list');
	var $fileInputs   = $fileUpload.find('.js_fileinputs');

	var fileNumber    = 0;
	var requestSize   = 0;
	var options       = {};

	var self          = this;

	var toArray = function(object) {
		return Array.prototype.slice.call(object, 0);
	};

	var hasFileReader = function() {
		return !!(window.File && window.FileList && window.FileReader);
	};

	var noPropagation = function(e) {
		e.stopPropagation();
		if (e.preventDefault) {
			return e.preventDefault();
		} else {
			return e.returnValue = false;
		}
	};

	var defaultOptions = {
		emptyImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=',
		errorMessageTimeout: 5000,
		maxFileSize: 3145728,
		maxFileNumber: 3,
		maxRequestSize: 9437184,
		errorMessages: {
			invalidFileNameError: 'Der Dateiname enthält ungültige Zeichen.',
			invalidFileTypeError: 'Ein Dateiformat ist nicht zugelassen. Bitte wählen sie ein anderes Dateiformat.',
			maxRequestSizeError: 'Das Datenlimit für den Upload von Dateien ist überschritten.',
			maxFileNumberError: 'Sie können nur maximal 3 Dateien anhängen.',
			maxFileSizeError: 'Eine Datei ist zu groß. Maximal 3 MB pro Datei sind zugelassen.'
		},
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
	 * Merge defaultoptions and useroptions in one object
	 */
	for (var i in defaultOptions) {
		if(opts.hasOwnProperty(i)) {
			options[i] = opts[i];
			if (typeof(options[i]) === 'function') {
				options[i] = options[i].bind(self);
			}
		} else{
			options[i] = defaultOptions[i];
		}
	}


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
			string = 'kB';
		} else {
			size = size * 10;
			string = 'B';
		}

		return (Math.round(size) / 10) + ' ' + string;
	};

	var getReadableFileType = function (nativeFile) {
		return options.acceptedTypes[getFileType(nativeFile)] || 'Unbekannt';
	};

	var isImage = function(nativeFile) {
		return (/^image\//).test(getFileType(nativeFile));
	};

	var convertToBase64File = function (nativeFile) {
		/* eslint new-cap: 0 */
		var deferred = $.Deferred();
		var reader = new FileReader();

		reader.onload = function (event) {
			deferred.resolve({
				data: event.target.result,
				nativeFile : nativeFile
			});
		};

		reader.onerror = function(){
			deferred.reject(this);
		};

		reader.readAsDataURL(nativeFile);

		return deferred.promise();
	};

	var parseBase64Files = function (nativeFiles) {
		return $.when.apply(null, nativeFiles.map(function (nativeFile) {
			return convertToBase64File(nativeFile);
		})).then(function () {
			return toArray(arguments);
		});
	};

	var trackFile = function (nativeFile) {
		fileNumber += 1;
		requestSize += nativeFile.size;
	};

	var untrackFile = function (nativeFile) {
		fileNumber -= 1;
		requestSize -= nativeFile.size;
	};

	var removeErrors = function (fadeOut) {
		var $errors = $fileUpload.find('.error');

		if (fadeOut) {
			$errors.fadeOut(400, function () {
				$errors.remove();
			});
		} else {
			$errors.remove();
		}
	};

	var errorTimeoutId;

	var showErrorMessage = function (error) {
		clearTimeout(errorTimeoutId);

		errorTimeoutId = setTimeout(function () {
			removeErrors(true);
		}, ERROR_MESSAGE_TIMEOUT);

		$dropBox.after($('<li class="error">' + error + '<li>'));
	};

	var validateFile = function(nativeFile) {
		var hasErrors = false;
		var errorMessages = options.errorMessages;

		if (fileNumber >= options.maxFileNumber) {
			hasErrors = true;
			showErrorMessage(errorMessages.maxFileNumberError);
		}

		if (requestSize >= options.maxRequestSize) {
			hasErrors = true;
			showErrorMessage(errorMessages.maxRequestSizeError);
		}

		if (!options.acceptedTypes[getFileType(nativeFile)]) {
			hasErrors = true;
			showErrorMessage(errorMessages.invalidFileTypeError);
		}

		if (nativeFile.size > options.maxFileSize) {
			hasErrors = true;
			showErrorMessage(errorMessages.maxFileSizeError);
		}

		if (!(/^[A-Za-z0-9.\-_ ]+$/).test(nativeFile.name)) {
			hasErrors = true;
			showErrorMessage(invalidFileNameError);
		}

		return !hasErrors;
	};

	var addFilePreview = function(nativeFile, $fileViewElement) {
		var reader = new FileReader();

		var $imgWrapper = $('<span class="thumbnail"></span>');

		reader.onload = function (event) {
			var image = new Image();

			if (isImage(nativeFile)) {
				image.src = event.target.result;
			} else {
				image.src = EMPTY_IMAGE;
			}

			image.width = 100;

			$fileViewElement.prepend($imgWrapper.append(image));
		};

		reader.readAsDataURL(nativeFile);
	};

	var addFileToView = function(nativeFile, removeHandler) {
		var fileSize = getReadableFileSize(nativeFile);
		var fileType = getReadableFileType(nativeFile);

		var $fileViewElement = $('<li class="file"></li>');

		$fileViewElement.append([
			'<span class="label name">',
			nativeFile.name,
			'</span><span class="label size">',
			fileSize,
			'</span><span class="label type">',
			fileType,
			'</span>'
		].join(''));

		var $removeButton = $('<span/>');

		$fileViewElement.append($removeButton);

		$removeButton.addClass('remove');

		$removeButton.on('click', function () {
			$fileViewElement.remove();

			removeHandler();
		});

		if (hasFileReader) {
			addFilePreview(nativeFile, $fileViewElement);
		}

		$fileView.append($fileViewElement);
	};

	var fileInputId = 0;

	var addNewFileInput = function () {
		var $fileInput = $('<input/>');

		fileInputId += 1;

		$fileInput.attr('name', 'fileInput' + fileInputId);
		$fileInput.attr('type', 'file');
		$fileInput.addClass('fileinput');

		$selectButton.prepend($fileInput);

		$fileInput.on('change', function () {
			removeErrors(false);

			var nativeFiles = toArray($(this).prop('files'));

			if (!nativeFiles.length) {
				return;
			}

			var nativeFile = nativeFiles[0];

			if (!validateFile(nativeFile)) {
				$fileInput.remove();
			} else {
				trackFile(nativeFile);

				$fileInput.appendTo($fileInputs);

				addFileToView(nativeFile, function () {
					untrackFile(nativeFile);

					$fileInput.remove();
				});
			}

			addNewFileInput();
		});
	};

	addNewFileInput();

	var createDndHandler = function (event) {
		removeErrors(false);

		var nativeFiles = toArray(event.originalEvent.dataTransfer.files);

		parseBase64Files(nativeFiles).done(function (base64Files) {
			base64Files.every(function (base64File) {
				var nativeFile = base64File.nativeFile;

				if (!validateFile(nativeFile)) {
					return false;
				}

				trackFile(nativeFile);

				var $hiddenDataField = $('<input type="hidden">');

				$hiddenDataField.val(base64File.data);
				$hiddenDataField.attr('name', 'file:' + nativeFile.name);
				$hiddenDataField.appendTo($fileInputs);

				addFileToView(nativeFile, function () {
					untrackFile(nativeFile);

					$hiddenDataField.remove();
				});

				return true;
			});
		});
	};

	$dropBox.on('drop', function(event) {
		noPropagation(event);
		$(this).removeClass('active');
		createDndHandler(event);
	});

	$dropBox.on('dragenter', function(ect) {
		noPropagation(event);
	});

	$dropBox.on('dragover', function(event) {
		noPropagation(event);
		$(this).addClass('active');
	});

	$dropBox.on('dragleave', function(event) {
		noPropagation(event);
		$(this).removeClass('active');
	});

	if (!hasFileReader) {
		$dropBox.hide();
	}

};

module.exports = EasyFileUpload

