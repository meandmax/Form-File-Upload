var helper = require('./helper.js');

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
