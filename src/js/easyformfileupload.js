var easyFormFileUploadApi = require('./easyformfileuploadapi.js');

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
