var utils    = require('./formfileuploadutils.js');

var FormFileUpload = function(fileUpload_, opts){

	var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

	var errorTimeoutId;
	var fileInputId = 0;

	var trackData = {
		fileNumber: 0,
		requestSize: 0
	};

	var self         = this;
	var fileUpload   = utils.extractDOMNodes(fileUpload_);
	var dropBox      = document.querySelector('.js_dropbox');
	var fileView     = document.querySelector('.js_list');
	var fileInputs   = document.querySelector('.js_fileinputs');
	var form         = document.querySelector('.js_form');
	var errorWrapper = document.createElement('div');
	var selectButton = document.createElement('div');

	var defaultOptions = {

		/**
		 * [timeout specifies how long the error messages are displayed]
		 * @type {Number}
		 */
		errorMessageTimeout: 4000,

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
		 * [Size of thumbnails displayed in the browser for preview the images]
		 * @type {Number}
		 */
		thumbnailSize: 100,

		/**
		 * [defines the maximum size of each request in bytes]
		 * @type {Number}
		 */
		maxRequestSize: 9437184,

		/**
		 * [If true the fallback for IE8 is activated]
		 * @type {Boolean}
		 */
		fallbackForIE8: true,

		/**
		 * [Regular Expression for filename matching]
		 * @type {String}
		 */
		fileNameRe: /^[A-Za-z0-9.\-_ ]+$/,

		/**
		 * [errormessage displayed when the file has characters which are not allowed]
		 * @type {String}
		 */
		invalidFileNameError: 'The name of the file has forbidden characters',

		/**
		 * [errormessage displayed when the filetype is not allowed]
		 * @type {String}
		 */
		invalidFileTypeError: 'The fileformat is not allowed',

		/**
		 * [errormessage displayed when the max. requestsize is reached]
		 * @type {String}
		 */
		maxRequestSizeError: 'The requestsize of the files you want to upload is exceeded.',

		/**
		 * [errormessage displayed when the max. filenumber is reached]
		 * @type {String}
		 */
		maxFileNumberError: 'You can upload 3 files, not more!',

		/**
		 * [errormessage displayed when the max. filensize is reached]
		 * @type {String}
		 */
		maxFileSizeError: 'One of the files is too large. the maximum filesize is 3 MB.',

		/**
		 * [If something during the filereading process went wrong, then this message is displayed]
		 * @type {String}
		 */
		unknownFileReaderError: 'Unknown Error while loading the file.',

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
	var options = utils.mergeOptions(opts, defaultOptions, self);

	/**
	 *
	 * Callback function for handling the async filereader response
	 * @param  {[string]} err     [the errormessage which gets thrown when the filereader errored]
	 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
	 */
	var convertBase64FileHandler = function(err, fileObj) {
		if (err) {
			console.log(err);
		}

		if (fileObj) {
			var removeHandler = utils.addBase64ToDom(fileObj, form);
			var fileType = utils.getReadableFileType(utils.getFileType(fileObj.file), options);
			var listElement = utils.createListElement(fileObj.file.name, utils.getReadableFileSize(fileObj.file), fileType);
			utils.addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

			if (utils.hasFileReader) {
				utils.addThumbnail(fileObj.file, listElement, options);
			}
		}
	};

	var validateFile = function(file) {
		if(!utils.validateFileNumber(trackData, options)){
			return options.maxFileNumberError;
		}

		if(!utils.validateRequestSize(trackData, options)){
			return options.maxRequestSizeError;
		}

		if(!utils.validateFileType(utils.getFileType(file), options)){
			return options.invalidFileTypeError;
		}

		if(!utils.validateFileSize(file, options)){
			return options.maxFileSizeError;
		}

		if(!utils.validateFileName(file, options)){
			return options.invalidFileNameError;
		}

		return true;
	};

	/**
	 * [converts the filedata into a base64 string and validates the filedata]
	 * @param  {[array]}  files  [the converted fileListObject]
	 */
	this.convertFilesToBase64 = function(files){
		files.every(function(file) {
			var reader = new FileReader();


			if(typeof validateFile(file) === 'string') {
				utils.showErrorMessage(validateFile(file), options.errorTimeoutId, utils.removeErrors, errorWrapper, form, fileView, options);
				return false;
			}

			utils.trackFile(file, trackData);

			reader.addEventListener('load', function(event) {
				convertBase64FileHandler(null, {
					data: event.target.result,
					file: file
				});
			});

			reader.addEventListener('error', function(event) {
				utils.convertBase64FileHandler(options.unknownFileReaderError);
			});

			reader.readAsDataURL(file);

			return true;
		});
	};

	/**
	 * [Add a fileInput with the selected file to form]
	 */
	this.addSelectedFile = function () {

		var fileInput = utils.createInputElement(fileInputId);

		form.insertBefore(selectButton, dropBox);
		selectButton.appendChild(fileInput);

		fileInput.addEventListener('change', function () {
			utils.removeErrors(errorWrapper);

			var file = this.files[0];
			var fileObj = { file: file };

			var removeHandler = function() {
				utils.untrackFile(file, trackData);
				fileInput.parentNode.removeChild(fileInput);
			};

			if(typeof validateFile(file) === 'string') {
				utils.showErrorMessage(validateFile(file), options.errorTimeoutId, utils.removeErrors, errorWrapper, form, fileView, options);
				fileInput.parentNode.removeChild(fileInput);
			} else {
				var fileType = utils.getReadableFileType(utils.getFileType(file), options);
				var listElement = utils.createListElement(file.name, fileType, utils.getReadableFileSize(fileObj.file));

				utils.trackFile(file, trackData);
				utils.addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

				if (utils.hasFileReader) {
					utils.addThumbnail(file, listElement, options);
				}

				fileInputs.appendChild(fileInput);
			}

			self.addSelectedFile();
		});
	};

	/**
	 * drophandler calls the dndHandler always whenn a file gets dropped
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('drop', function(event) {
		utils.noPropagation(event);
		var files = utils.toArray(event.dataTransfer.files);
		self.convertFilesToBase64(files);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragenter', function(event) {
		utils.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragover', function(event) {
		utils.noPropagation(event);
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */

	dropBox.addEventListener('dragleave', function(event) {
		utils.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * If there is no filereader available, then the dropzone should not be displayed and the Fallback is displayed
	 */
	if (!utils.hasFileReader() && options.fallbackForIE8 ) {
		selectButton.className = 'selectbutton js_selectbutton';

		var span = document.createElement('span');
		span.innerHTML = 'Select File';

		selectButton.appendChild(span);

		self.addSelectedFile();
		dropBox.style.display = "none";
	}
};

module.exports = FormFileUpload;
