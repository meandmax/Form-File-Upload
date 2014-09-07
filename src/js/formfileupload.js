var helper = require('./helper.js');

var FormFileUpload = function(fileUpload_, opts){

	var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

	var errorTimeoutId;
	var fileInputId = 0;
	var fileNumber  = 0;
	var requestSize = 0;

	var self         = this;
	var fileUpload   = helper.extractDOMNodes(fileUpload_);
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
		errorMessageTimeout: 5000,

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
		 * [defines if the thumbails are displayed in circles, otherwise rectangles]
		 * @type {Boolean}
		 */
		circleThumbnail: false,

		/**
		 * [defines the maximum size of each request in bytes]
		 * @type {Number}
		 */
		maxRequestSize: 9437184,

		/**
		 * [errormessage displayed when the file has characters which are not allowed]
		 * @type {String}
		 */
		invalidFileNameError: 'Der Dateiname enthält ungültige Zeichen.',

		/**
		 * [errormessage displayed when the filetype is not allowed]
		 * @type {String}
		 */
		invalidFileTypeError: 'Ein Dateiformat ist nicht zugelassen. Bitte wählen sie ein anderes Dateiformat.',

		/**
		 * [errormessage displayed when the max. requestsize is reached]
		 * @type {String}
		 */
		maxRequestSizeError: 'Das Datenlimit für den Upload von Dateien ist überschritten.',

		/**
		 * [errormessage displayed when the max. filenumber is reached]
		 * @type {String}
		 */
		maxFileNumberError: 'Sie können nur maximal 3 Dateien anhängen.',

		/**
		 * [errormessage displayed when the max. filensize is reached]
		 * @type {String}
		 */
		maxFileSizeError: 'Eine Datei ist zu groß. Maximal 3 MB pro Datei sind zugelassen.',

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
	var options = helper.mergeOptions(opts, defaultOptions, self);

	/**
	 * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
	 * @param {[object]} file
	 */
	var trackFile = function (file) {
		fileNumber += 1;
		requestSize += file.size;
	};

	/**
	 * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
	 * @param  {[type]} file
	 */
	var untrackFile = function (file) {
		fileNumber -= 1;
		requestSize -= file.size;
	};

	/**
	 * [returns the prettified filestype string based on the specified options]
	 * @param  {[object]} file [fileobject with mimetye]
	 * @return {[string]}      [prettified typestring]
	 */
	var getReadableFileType = function (file) {
		return options.acceptedTypes[helper.getFileType(file)] || 'Unbekannt';
	};

	/**
	 * [validateFile description]
	 * @param  {[object]}  file
	 * @return {[boolean]} [is true if the file is valid and the request is also valid]
	 */
	this.validateFile = function(file) {
		var hasErrors = false;

		if (fileNumber >= options.maxFileNumber) {
			hasErrors = true;
			self.showErrorMessage(options.maxFileNumberError);
		}

		if (requestSize >= options.maxRequestSize) {
			hasErrors = true;
			self.showErrorMessage(options.maxRequestSizeError);
		}

		if (!options.acceptedTypes[helper.getFileType(file)]) {
			hasErrors = true;
			self.showErrorMessage(options.invalidFileTypeError);
		}

		if (file.size > options.maxFileSize) {
			hasErrors = true;
			self.showErrorMessage(options.maxFileSizeError);
		}

		if (!(/^[A-Za-z0-9.\-_ ]+$/).test(file.name)) {
			hasErrors = true;
			self.showErrorMessage(invalidFileNameError);
		}

		return hasErrors;
	};

	/**
	 * [displays the Error message & removes it also after the specified timeout]
	 * @param  {[string]} error [error message which has to be displayed]
	 */
	this.showErrorMessage = function (error) {

		clearTimeout(errorTimeoutId);

		errorTimeoutId = setTimeout(function () {
			self.removeErrors();
		}, options.errorMessageTimeout);

		var errorElement = document.createElement('li');

		errorElement.className = 'error';

		errorElement.innerHTML = error;
		errorWrapper.appendChild(errorElement);

		form.insertBefore(errorWrapper, fileView);
	};

	/**
	 * [removes all errors]
	 */
	this.removeErrors = function () {
		var errors = document.querySelectorAll('.error');
		errorWrapper.innerHTML = '';
	};

	/**
	 * [if possible adds a thumbnail of the given file to the DOM]
	 * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
	 * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
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
	 * [Creates a list item which gets injected to the DOM]
	 * @param {[object]} fileObj             [filedata for adding the filedata & preview to the DOM]
	 * @param {[function]} removeFileHandler [callback for notifying that the specified file was deleted]
	 */
	var addFileToView = function(fileObj, removeFileHandlerCallback){
		var fileSize = helper.getReadableFileSize(fileObj.file);
		var fileType = getReadableFileType(fileObj.file);

		var fileElement = document.createElement('li');

		console.log('Hello: addFileToView');

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

		// Add remove Element & register remove Handler
		var removeButton = document.createElement('span');
		removeButton.className = 'remove';
		fileElement.appendChild(removeButton);

		fileView.appendChild(fileElement);

		removeButton.addEventListener('click', function(event) {

			// calls the callback of the DND Handler
			removeFileHandlerCallback();

			// remove fileViewElement
			fileElement.parentNode.removeChild(fileElement);

			untrackFile(fileObj.file);
		});
	};


	/**
	 * [Creates a hidden input field where the base64 data is stored]
	 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
	 */
	var addBase64ToDom = function(fileObj){
		var input = document.createElement("input");
		input.type = "hidden";
		input.value = fileObj.data;
		input.name = 'file:' + fileObj.file.name;
		form.appendChild(input);
		addFileToView(fileObj, function(){
			//remove hidden input
			input.remove();
		});
	};

	/**
	 * Callback function for handling the async filereader response
	 * @param  {[string]} err     [the errormessage which gets thrown when the filereader errored]
	 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
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
	 * [converts the filedata into a base64 string and validates the filedata]
	 * @param  {[array]}    files                    [the converted fileListObject]
	 * @param  {[function]} convertBase64FileHandler [gets called when the reader had converted the filedata successfully]
	 */
	var convertFilesToBase64 = function(files, convertBase64FileHandler){
		files.every(function(file) {
			var reader = new FileReader();

			if( self.validateFile(file) ) {
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

	var addNewFileInput = function () {
		var fileInput = document.createElement('input');

		fileInput.type = 'file';
		fileInput.className = 'fileinput';
		fileInputId += 1;

		fileInput.name = 'fileInput ' + fileInputId;

		form.insertBefore(selectButton, dropBox);
		selectButton.appendChild(fileInput);

		fileInput.addEventListener('change', function () {
			self.removeErrors();

			var nativeFile = fileInput.files[0];
			var fileObj = { file: nativeFile };


			if (self.validateFile(nativeFile)) {
				fileInput.parentNode.removeChild(fileInput);
			} else {
				trackFile(nativeFile);

				fileInputs.appendChild(fileInput);

				addFileToView(fileObj, function () {
					untrackFile(nativeFile);
					fileInput.parentNode.removeChild(fileInput);
				});
			}

			addNewFileInput();
		});
	};

	/**
	 * The dndHandler function is the only function which is publicly exposed
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	this.addDroppedFiles = function(event){
		var files = helper.toArray(event.dataTransfer.files);
		convertFilesToBase64(files, convertBase64FileHandler);
	};

	/**
	 * drophandler calls the dndHandler always whenn a file gets dropped
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('drop', function(event) {
		helper.noPropagation(event);
		self.addDroppedFiles(event);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragenter', function(event) {
		helper.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */
	dropBox.addEventListener('dragover', function(event) {
		helper.noPropagation(event);
	});

	/**
	 * The other events are also handled cause they have to be
	 * @param {[object]} event [dropEvent where the filelist is binded]
	 */

	dropBox.addEventListener('dragleave', function(event) {
		helper.noPropagation(event);
		this.classList.toggle('active');
	});

	/**
	 * If there is no filereader available, then the dropzone should not be displayed and the Fallback is displayed
	 */
	if (!helper.hasFileReader()) {
		selectButton.className = 'selectbutton js_selectbutton';
		var span = document.createElement('span');
		span.innerHTML = 'Select File';
		selectButton.appendChild(span);

		// addNewFileInput();
		dropBox.style.display = "none";
	}
};

module.exports = FormFileUpload;
