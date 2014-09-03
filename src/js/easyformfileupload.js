var helper = require('./helper.js');

var EasyFormFileUpload = function(fileUpload_, dropBox_, opts){

	var ERROR_MESSAGE_TIMEOUT = 5000;
	var EMPTY_IMAGE           = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

	var errorTimeoutId;

	var self        = this;
	var fileUpload  = helper.extractDOMNodes(fileUpload_);
	var dropBox     = helper.extractDOMNodes(dropBox_);
	var fileView    = document.querySelector('.js_list');
	var fileInputs  = document.querySelector('.js_fileinputs');
	var form        = document.querySelector('.js_form');
	var fileInputId = 0;
	var errorWrapper = document.createElement('div');

	var fileNumber  = 0;
	var requestSize = 0;

	var defaultOptions = {

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
	 * [validateFile description]
	 * @param  {[type]} file [description]
	 * @return {[type]}      [description]
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
	 * [trackFile description]
	 * @param  {[type]} file [description]
	 * @return {[type]}      [description]
	 */
	var trackFile = function (file) {
		fileNumber += 1;
		requestSize += file.size;
	};

	/**
	 * [untrackFile description]
	 * @param  {[type]} file [description]
	 * @return {[type]}      [description]
	 */
	var untrackFile = function (file) {
		fileNumber -= 1;
		requestSize -= file.size;
	};

	/**
	 * [showErrorMessage description]
	 * @param  {[type]} error [description]
	 * @return {[type]}       [description]
	 */
	var showErrorMessage = function (error) {
		removeErrors();

		clearTimeout(errorTimeoutId);

		errorTimeoutId = setTimeout(function () {
			removeErrors();
			console.log('hallo');
		}, ERROR_MESSAGE_TIMEOUT);

		var errorElement = document.createElement('li');

		errorElement.className = 'error';

		errorElement.innerHTML = error;
		errorWrapper.appendChild(errorElement);

		form.insertBefore(errorWrapper, fileView);
	};

	/**
	 * [removeErrors description]
	 * @param  {[type]} fadeOut [description]
	 * @return {[type]}         [description]
	 */
	var removeErrors = function () {
		var errors = document.querySelectorAll('.error');
		errorWrapper.innerHTML = '';
	};

	/**
	 * [getReadableFileType description]
	 * @param  {[type]} file [description]
	 * @return {[type]}      [description]
	 */
	var getReadableFileType = function (file) {
		return options.acceptedTypes[helper.getFileType(file)] || 'Unbekannt';
	};

	/**
	 * [addThumbnail description]
	 * @param {[type]} file    [description]
	 * @param {[type]} element [description]
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
	 * [addFileToView description]
	 * @param {[type]} fileObj           [description]
	 * @param {[type]} removeFileHandler [description]
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

		fileView.appendChild(fileElement);

		// Add remove Element & register remove Handler
		var removeButton = document.createElement('span');
		removeButton.className = 'remove';

		removeButton.addEventListener('click', function(event) {

			//calls the callback of the DND Handler
			removeFileHandlerCallback();

			//remove fileViewElement
			fileElement.remove();

			untrackFile(fileObj.file);
		});
	};


	/**
	 * [addBase64ToDom description]
	 * @param {[type]} fileObj [description]
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
	 * [convertBase64FileHandler description]
	 * @param  {[type]} err     [description]
	 * @param  {[type]} fileObj [description]
	 * @return {[type]}         [description]
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
	 * [convertFilesToBase64 description]
	 * @param  {[type]} files                    [description]
	 * @param  {[type]} convertBase64FileHandler [description]
	 * @return {[type]}                          [description]
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
	 * [dndHandler description]
	 * @param  {[type]} event [description]
	 * @return {[type]}       [description]
	 */
	this.dndHandler = function(event){
		var files = helper.toArray(event.dataTransfer.files);
		convertFilesToBase64(files, convertBase64FileHandler);
	};

	dropBox.addEventListener('drop', function(event) {
		helper.noPropagation(event);
		self.dndHandler(event);
		this.classList.toggle('active');
	});

	dropBox.addEventListener('dragenter', function(event) {
		helper.noPropagation(event);
		this.classList.toggle('active');
	});

	dropBox.addEventListener('dragover', function(event) {
		helper.noPropagation(event);
	});

	dropBox.addEventListener('dragleave', function(event) {
		helper.noPropagation(event);
		this.classList.toggle('active');
	});

	if (!helper.hasFileReader()) {
		dropBox.hide();
	}
};

module.exports = EasyFormFileUpload;
