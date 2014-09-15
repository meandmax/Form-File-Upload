/**
 * [extractDOMNodes description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
var extractDOMNodes = function(obj) {
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
var toArray = function(object) {
	return Array.prototype.slice.call(object, 0);
};

/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function() {
	return !!(window.File && window.FileList && window.FileReader);
};

/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
var noPropagation = function(e) {
	e.stopPropagation();
	if (e.preventDefault) {
		return e.preventDefault();
	} else {
		e.returnValue = false;
		return false;
	}
};

/**
 * [mergeOptions description]
 * @param  {[type]} opts           [description]
 * @param  {[type]} defaultoptions [description]
 * @return {[type]}                [description]
 */
var mergeOptions = function(opts, defaultOptions, self) {
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
var getFileType = function (file) {
	// Fix chromium issue 105382: Excel (.xls) FileReader mime type is empty.
	if ((/\.xls$/).test(file.name) && !file.type) {
		return 'application/vnd.ms-excel';
	}
	return file.type;
};

/**
 * Takes the native filesize in bytes and returns the prettified filesize
 * @param  {[object]} file [contains the size of the file]
 * @return {[string]}      [prettified filesize]
 */
var getReadableFileSize = function(file) {
	var size = file.size;
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
 * [isImage description]
 * @param  {[type]}  file [description]
 * @return {Boolean}      [description]
 */
var isImage = function(file) {
	return (/^image\//).test(getFileType(file));
};

/**
 * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var trackFile = function(file, trackData) {
	trackData.fileNumber += 1;
	trackData.requestSize += file.size;
};

/**
 * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var untrackFile = function (file, trackData) {
	trackData.fileNumber -= 1;
	trackData.requestSize -= file.size;
};

/**
 * [returns the prettified filestype string based on the specified options]
 * @param  {[string]} fileType [mimetype of file]
 * @return {[string]}      [prettified typestring]
 */
var getReadableFileType = function (fileType, options) {
	return options.acceptedTypes[fileType] || 'unknown filetype';
};

var validateFileNumber = function(trackData, options) {
	if (trackData.fileNumber >= options.maxFileNumber) {
		return false;
	}
	return true;
};

var validateRequestSize = function(requestSize, options) {
	if (requestSize >= options.maxRequestSize) {
		return false;
	}
	return true;
};

var validateFileType = function(fileType, options) {
	if (!options.acceptedTypes[fileType]) {
		return false;
	}
	return true;
};

var validateFileSize = function(file, options) {
	if (file.size > options.maxFileSize) {
		return false;
	}
	return true;
};

var validateFileName = function(file, options) {
	if (!(options.fileNameRe).test(file.name)) {
		return false;
	}
	return true;
};

/**
 * [displays the Error message & removes it also after the specified timeout]
 * @param  {[string]} error [error message which has to be displayed]
 */
var showErrorMessage = function(error, errorTimeoutId, removeErrors, errorWrapper, form, fileView, options) {
	var errorElement = document.createElement('li');
	errorElement.className = 'error';
	errorElement.innerHTML = error;

	clearTimeout(errorTimeoutId);

	errorTimeoutId = setTimeout(function() {
		removeErrors(errorWrapper);
	}, options.errorMessageTimeout);

	errorWrapper.appendChild(errorElement);
	form.insertBefore(errorWrapper, fileView);
};

/**
 * [removes all errors]
 */
var removeErrors = function(errorWrapper) {
	var errors = document.querySelectorAll('.error');
	errorWrapper.innerHTML = '';
};


/**
 * [if possible adds a thumbnail of the given file to the DOM]
 * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
 * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
 */
var addThumbnail = function(file, element, options){
	var reader = new FileReader();
	var imgWrapper = document.createElement('span');
	var fileName = element.querySelector('.js_name');
	imgWrapper.className = 'thumbnail';

	if(!!options.circleThumbnail){
		imgWrapper.className += ' circle';
	}

	reader.addEventListener('load', function(event){
		var image = new Image();

		if (isImage(file)) {
			image.src = event.target.result;
		} else {
			image.src = EMPTY_IMAGE;
		}

		imgWrapper.appendChild(image);
		element.insertBefore(imgWrapper, fileName);
	});

	reader.readAsDataURL(file);
};

/**
 * [Creates a listElement with the data of the passed object]
 * @param  {[type]} fileObj [used to put the information of the file in the listElememt]
 * @return {[object]}       [the listElement which gets injected in the DOM]
 */
var createListElement = function(fileName, fileSize, fileType){

	var fileElement = document.createElement('li');
	fileElement.className = 'file';

	fileElement.innerHTML = [
	'<span class="label js_name name">',
	fileName,
	'</span><span class="label size">',
	fileSize,
	'</span><span class="label type">',
	fileType,
	'</span>'].join('');

	return fileElement;
};

/**
 * [Creates a list item which gets injected to the DOM]
 * @param {[object]} fileObj             [filedata for adding the filedata & preview to the DOM]
 * @param {[function]} removeFileHandler [callback for notifying that the specified file was deleted]
 */
var addFileToView = function(fileObj, removeFileHandlerCallback, trackData, fileView, listElement){

	// Add remove Element & register remove Handler
	var removeButton = document.createElement('span');
	removeButton.className = 'remove';
	listElement.appendChild(removeButton);

	fileView.appendChild(listElement);

	removeButton.addEventListener('click', function(event) {

		// calls the callback of the DND Handler
		removeFileHandlerCallback(trackData);

		// remove fileViewElement
		listElement.parentNode.removeChild(listElement);

		untrackFile(fileObj.file, trackData);
	});
};

/**
 * [Creates a hidden input field where the base64 data is stored]
 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
 */
var addBase64ToDom = function(fileObj, form){
	var input = document.createElement("input");
	input.type = "hidden";
	input.value = fileObj.data;
	input.name = 'file:' + fileObj.file.name;
	form.appendChild(input);

	return function(file, trackData){
		input.parentNode.removeChild(input);
	};
};

/**
 * [createInputElement description]
 * @return {[type]} [description]
 */
var createInputElement = function(fileInputId){
	var fileInput = document.createElement('input');

	fileInput.type = 'file';
	fileInput.className = 'fileinput';
	fileInputId += 1;

	fileInput.name = 'fileInput ' + fileInputId;

	return fileInput;
};

exports.extractDOMNodes     = extractDOMNodes;
exports.toArray             = toArray;
exports.hasFileReader       = hasFileReader;
exports.noPropagation       = noPropagation;
exports.mergeOptions        = mergeOptions;
exports.getFileType         = getFileType;
exports.getReadableFileSize = getReadableFileSize;
exports.isImage             = isImage;
exports.addBase64ToDom      = addBase64ToDom;
exports.createInputElement  = createInputElement;
exports.removeErrors        = removeErrors;
exports.trackFile           = trackFile;
exports.untrackFile         = untrackFile;
exports.getReadableFileType = getReadableFileType;
exports.validateFileNumber  = validateFileNumber;
exports.validateRequestSize = validateRequestSize;
exports.validateFileType    = validateFileType;
exports.validateFileSize    = validateFileSize;
exports.validateFileName    = validateFileName;
exports.showErrorMessage    = showErrorMessage;
exports.createListElement   = createListElement;
exports.addThumbnail        = addThumbnail;
exports.addFileToView       = addFileToView;
exports.addBase64ToDom      = addBase64ToDom;
exports.createInputElement  = createInputElement;
