(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global document, FileReader */

var utils = require('./formfileuploadutils.js');

var FormFileUpload = function (fileUpload_, opts) {
    'use strict';

    var errorTimeoutId;
    var fileInputId = 0;

    var trackData = {
        fileNumber: 0,
        requestSize: 0
    };

    var self         = this;
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
    var convertBase64FileHandler = function (err, fileObj) {
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

    var validateFile = function (file) {
        if (!utils.validateFileNumber(trackData, options)) {
            return options.maxFileNumberError;
        }

        if (!utils.validateRequestSize(trackData, options)) {
            return options.maxRequestSizeError;
        }

        if (!utils.validateFileType(utils.getFileType(file), options)) {
            return options.invalidFileTypeError;
        }

        if (!utils.validateFileSize(file, options)) {
            return options.maxFileSizeError;
        }

        if (!utils.validateFileName(file, options)) {
            return options.invalidFileNameError;
        }

        return true;
    };

    /**
     * [converts the filedata into a base64 string and validates the filedata]
     * @param  {[array]}  files  [the converted fileListObject]
     */
    this.convertFilesToBase64 = function (files) {
        files.every(function (file) {
            var reader = new FileReader();

            if (typeof validateFile(file) === 'string') {
                utils.showErrorMessage(validateFile(file), errorTimeoutId, utils.removeErrors, errorWrapper, form, fileView, options);
                return false;
            }

            utils.trackFile(file, trackData);

            reader.addEventListener('load', function (event) {
                convertBase64FileHandler(null, {
                    data: event.target.result,
                    file: file
                });
            });

            reader.addEventListener('error', function () {
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

            var fileObj = {
                file: file
            };

            var removeHandler = function () {
                utils.untrackFile(file, trackData);
                fileInput.parentNode.removeChild(fileInput);
            };

            if (typeof validateFile(file) === 'string') {
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
    dropBox.addEventListener('drop', function (event) {
        utils.noPropagation(event);
        var files = utils.toArray(event.dataTransfer.files);
        self.convertFilesToBase64(files);
        this.classList.toggle('active');
    });

    /**
     * The other events are also handled cause they have to be
     * @param {[object]} event [dropEvent where the filelist is binded]
     */
    dropBox.addEventListener('dragenter', function (event) {
        utils.noPropagation(event);
        this.classList.toggle('active');
    });

    /**
     * The other events are also handled cause they have to be
     * @param {[object]} event [dropEvent where the filelist is binded]
     */
    dropBox.addEventListener('dragover', function (event) {
        utils.noPropagation(event);
    });

    /**
     * The other events are also handled cause they have to be
     * @param {[object]} event [dropEvent where the filelist is binded]
     */

    dropBox.addEventListener('dragleave', function (event) {
        utils.noPropagation(event);
        this.classList.toggle('active');
    });

    /**
     * If there is no filereader available, then the dropzone should not be displayed and the Fallback is displayed
     */
    if (!utils.hasFileReader() && options.fallbackForIE8) {
        selectButton.className = 'selectbutton js_selectbutton';

        var span = document.createElement('span');
        span.innerHTML = 'Select File';

        selectButton.appendChild(span);

        self.addSelectedFile();
        dropBox.style.display = 'none';
    }
};

module.exports = FormFileUpload;

/* global $, FormFileUpload */

$.fn.formFileUpload = function (options) {
    'use strict';

    return this.each(function () {
        var instanceOptions;

        if (!$.data(this, 'formFileUpload')) {
            instanceOptions = $.extend({}, options, $(this).data());
            $.data(this, 'formFileUpload', new FormFileUpload(this, instanceOptions));
        }
    });
};

},{"./formfileuploadutils.js":2}],2:[function(require,module,exports){
/* global window, document, FileReader, Image */

/**
 * [extractDOMNodes description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
var extractDOMNodes = function (obj) {
    'use strict';

    if (typeof obj === 'function') {
        return obj[0];
    }

    return obj;
};

/**
 * [toArray description]
 * @param  {[type]} object [description]
 * @return {[type]}        [description]
 */
var toArray = function (object) {
    'use strict';

    return Array.prototype.slice.call(object, 0);
};

/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function () {
    'use strict';

    return !!(window.File && window.FileList && window.FileReader);
};

/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
var noPropagation = function (e) {
    'use strict';

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
var mergeOptions = function (opts, defaultOptions, self) {
    'use strict';

    var options = {};

    for (var i in defaultOptions) {
        if (opts && opts.hasOwnProperty(i)) {
            options[i] = opts[i];

            if (typeof (options[i]) === 'function') {
                options[i] = options[i].bind(self);
            }
        } else {
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
    'use strict';

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
var getReadableFileSize = function (file) {
    'use strict';

    var size = file.size;
    var string;

    if (size >= 1024 * 1024 * 1024 * 1024) {
        size = size / (1024 * 1024 * 1024 * 1024 / 10);
        string = 'TB';
    } else if (size >= 1024 * 1024 * 1024) {
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
var isImage = function (file) {
    'use strict';

    return (/^image\//).test(getFileType(file));
};

/**
 * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var trackFile = function (file, trackData) {
    'use strict';

    trackData.fileNumber += 1;
    trackData.requestSize += file.size;
};

/**
 * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
var untrackFile = function (file, trackData) {
    'use strict';

    trackData.fileNumber -= 1;
    trackData.requestSize -= file.size;
};

/**
 * [returns the prettified filestype string based on the specified options]
 * @param  {[string]} fileType [mimetype of file]
 * @return {[string]}      [prettified typestring]
 */
var getReadableFileType = function (fileType, options) {
    'use strict';

    return options.acceptedTypes[fileType] || 'unknown filetype';
};

var validateFileNumber = function (trackData, options) {
    'use strict';

    if (trackData.fileNumber >= options.maxFileNumber) {
        return false;
    }

    return true;
};

var validateRequestSize = function (requestSize, options) {
    'use strict';

    if (requestSize >= options.maxRequestSize) {
        return false;
    }

    return true;
};

var validateFileType = function (fileType, options) {
    'use strict';

    if (!options.acceptedTypes[fileType]) {
        return false;
    }

    return true;
};

var validateFileSize = function (file, options) {
    'use strict';

    if (file.size > options.maxFileSize) {
        return false;
    }

    return true;
};

var validateFileName = function (file, options) {
    'use strict';

    if (!(options.fileNameRe).test(file.name)) {
        return false;
    }

    return true;
};

/**
 * [displays the Error message & removes it also after the specified timeout]
 * @param  {[string]} error [error message which has to be displayed]
 */
var showErrorMessage = function (error, errorTimeoutId, removeErrors, errorWrapper, form, fileView, options) {
    'use strict';

    var errorElement = document.createElement('li');

    errorElement.className = 'error';
    errorElement.innerHTML = error;

    clearTimeout(errorTimeoutId);

    errorTimeoutId = setTimeout(function () {
        removeErrors(errorWrapper);
    }, options.errorMessageTimeout);

    errorWrapper.appendChild(errorElement);
    form.insertBefore(errorWrapper, fileView);
};

/**
 * [removes all errors]
 */
var removeErrors = function (errorWrapper) {
    'use strict';

    errorWrapper.innerHTML = '';
};

/**
 * [if possible adds a thumbnail of the given file to the DOM]
 * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
 * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
 */
var addThumbnail = function (file, element, options) {
    'use strict';

    var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

    var reader = new FileReader();
    var factor = window.devicePixelRatio;
    var imgWrapper = document.createElement('span');

    var canvas = document.createElement('canvas');

    canvas.width  = options.thumbnailSize * factor;
    canvas.height = options.thumbnailSize * factor;

    var ctx = canvas.getContext('2d');

    if (factor > 1) {
        ctx.webkitBackingStorePixelRatio = factor;
        ctx.scale(factor, factor);
    }

    var fileName = element.querySelector('.js_name');
    var image = new Image();
    imgWrapper.className = 'thumbnail';

    image.addEventListener('load', function () {
        var ratio = this.height / this.width;

        canvas.height = canvas.width * ratio;
        ctx.drawImage(this, 0, 0, options.thumbnailSize, options.thumbnailSize * ratio);
    });

    reader.addEventListener('load', function (event) {
        if (isImage(file)) {
            image.src = event.target.result;
        } else {
            image.src = EMPTY_IMAGE;
        }

        imgWrapper.appendChild(canvas);
        element.insertBefore(imgWrapper, fileName);
    });

    reader.readAsDataURL(file);
};

/**
 * [Creates a listElement with the data of the passed object]
 * @param  {[type]} fileObj [used to put the information of the file in the listElememt]
 * @return {[object]}       [the listElement which gets injected in the DOM]
 */
var createListElement = function (fileName, fileSize, fileType) {
    'use strict';

    var fileElement = document.createElement('li');
    fileElement.className = 'file';

    fileElement.innerHTML = [
    '<span class="label js_name name">',
    fileName,
    '</span><span class="label size">',
    fileSize,
    '</span><span class="label type">',
    fileType,
    '</span>' ].join('');

    return fileElement;
};

/**
 * [Creates a list item which gets injected to the DOM]
 * @param {[object]} fileObj             [filedata for adding the filedata & preview to the DOM]
 * @param {[function]} removeFileHandler [callback for notifying that the specified file was deleted]
 */
var addFileToView = function (fileObj, removeFileHandlerCallback, trackData, fileView, listElement) {
    'use strict';

    // Add remove Element & register remove Handler
    var removeButton = document.createElement('span');
    removeButton.className = 'remove';
    listElement.appendChild(removeButton);

    fileView.appendChild(listElement);

    removeButton.addEventListener('click', function () {
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
var addBase64ToDom = function (fileObj, form) {
    'use strict';

    var input = document.createElement('input');

    input.type = 'hidden';
    input.value = fileObj.data;
    input.name = 'file:' + fileObj.file.name;

    form.appendChild(input);

    return function () {
        input.parentNode.removeChild(input);
    };
};

/**
 * [createInputElement description]
 * @return {[type]} [description]
 */
var createInputElement = function (fileInputId) {
    'use strict';

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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvZmFrZV8yZTIyYjRhZC5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL2Zvcm1maWxldXBsb2FkdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgZG9jdW1lbnQsIEZpbGVSZWFkZXIgKi9cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi9mb3JtZmlsZXVwbG9hZHV0aWxzLmpzJyk7XG5cbnZhciBGb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChmaWxlVXBsb2FkXywgb3B0cykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBlcnJvclRpbWVvdXRJZDtcbiAgICB2YXIgZmlsZUlucHV0SWQgPSAwO1xuXG4gICAgdmFyIHRyYWNrRGF0YSA9IHtcbiAgICAgICAgZmlsZU51bWJlcjogMCxcbiAgICAgICAgcmVxdWVzdFNpemU6IDBcbiAgICB9O1xuXG4gICAgdmFyIHNlbGYgICAgICAgICA9IHRoaXM7XG4gICAgdmFyIGRyb3BCb3ggICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19kcm9wYm94Jyk7XG4gICAgdmFyIGZpbGVWaWV3ICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19saXN0Jyk7XG4gICAgdmFyIGZpbGVJbnB1dHMgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19maWxlaW5wdXRzJyk7XG4gICAgdmFyIGZvcm0gICAgICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19mb3JtJyk7XG4gICAgdmFyIGVycm9yV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBzZWxlY3RCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogW3RpbWVvdXQgc3BlY2lmaWVzIGhvdyBsb25nIHRoZSBlcnJvciBtZXNzYWdlcyBhcmUgZGlzcGxheWVkXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3JNZXNzYWdlVGltZW91dDogNTAwMCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW3RoZSBtYXhpbXVtIGZpbGVzaXplIG9mIGVhY2ggZmlsZSBpbiBieXRlc11cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVTaXplOiAzMTQ1NzI4LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbbWF4RmlsZU51bWJlciBkZWZpbmVzIGhvdyBtYW55IGZpbGVzIGFyZSBhbGxvd2VkIHRvIHVwbG9hZCB3aXRoIGVhY2ggcmVxdWVzdF1cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVOdW1iZXI6IDMsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtTaXplIG9mIHRodW1ibmFpbHMgZGlzcGxheWVkIGluIHRoZSBicm93c2VyIGZvciBwcmV2aWV3IHRoZSBpbWFnZXNdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aHVtYm5haWxTaXplOiAxMDAsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtkZWZpbmVzIHRoZSBtYXhpbXVtIHNpemUgb2YgZWFjaCByZXF1ZXN0IGluIGJ5dGVzXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4UmVxdWVzdFNpemU6IDk0MzcxODQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtJZiB0cnVlIHRoZSBmYWxsYmFjayBmb3IgSUU4IGlzIGFjdGl2YXRlZF1cbiAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmYWxsYmFja0ZvcklFODogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW1JlZ3VsYXIgRXhwcmVzc2lvbiBmb3IgZmlsZW5hbWUgbWF0Y2hpbmddXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWxlTmFtZVJlOiAvXltBLVphLXowLTkuXFwtXyBdKyQvLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBmaWxlIGhhcyBjaGFyYWN0ZXJzIHdoaWNoIGFyZSBub3QgYWxsb3dlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGludmFsaWRGaWxlTmFtZUVycm9yOiAnVGhlIG5hbWUgb2YgdGhlIGZpbGUgaGFzIGZvcmJpZGRlbiBjaGFyYWN0ZXJzJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgZmlsZXR5cGUgaXMgbm90IGFsbG93ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpbnZhbGlkRmlsZVR5cGVFcnJvcjogJ1RoZSBmaWxlZm9ybWF0IGlzIG5vdCBhbGxvd2VkJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgbWF4LiByZXF1ZXN0c2l6ZSBpcyByZWFjaGVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4UmVxdWVzdFNpemVFcnJvcjogJ1RoZSByZXF1ZXN0c2l6ZSBvZiB0aGUgZmlsZXMgeW91IHdhbnQgdG8gdXBsb2FkIGlzIGV4Y2VlZGVkLicsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gZmlsZW51bWJlciBpcyByZWFjaGVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4RmlsZU51bWJlckVycm9yOiAnWW91IGNhbiB1cGxvYWQgMyBmaWxlcywgbm90IG1vcmUhJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgbWF4LiBmaWxlbnNpemUgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVTaXplRXJyb3I6ICdPbmUgb2YgdGhlIGZpbGVzIGlzIHRvbyBsYXJnZS4gdGhlIG1heGltdW0gZmlsZXNpemUgaXMgMyBNQi4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbSWYgc29tZXRoaW5nIGR1cmluZyB0aGUgZmlsZXJlYWRpbmcgcHJvY2VzcyB3ZW50IHdyb25nLCB0aGVuIHRoaXMgbWVzc2FnZSBpcyBkaXNwbGF5ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1bmtub3duRmlsZVJlYWRlckVycm9yOiAnVW5rbm93biBFcnJvciB3aGlsZSBsb2FkaW5nIHRoZSBmaWxlLicsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtPYmplY3RzIGNvbnRhaW5zIGFsbCBhbGxvd2VkIG1pbWV0eXBlcyBhcyBrZXlzICYgdGhlIHByZXR0aWZpZWQgZmlsZW5hbWVzIGFzIHZhbHVlc11cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGFjY2VwdGVkVHlwZXM6IHtcbiAgICAgICAgICAgICdpbWFnZS9wbmcnOiAnUE5HLUJpbGQnLFxuICAgICAgICAgICAgJ2ltYWdlL2pwZWcnOiAnSlBFRy1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS9naWYnOiAnR0lGLUJpbGQnLFxuICAgICAgICAgICAgJ2ltYWdlL3RpZmYnOiAnVElGRi1CaWxkJyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9wZGYnOiAnUERGLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnOiAnRXhjZWwtRG9rdW1lbnQnLFxuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0JzogJ0V4Y2VsLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9tc3dvcmQnOiAnV29yZC1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQnOiAnV29yZC1Eb2t1bWVudCdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNZXJnaW5nIHRoZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgdXNlciBwYXNzZWQgb3B0aW9ucyB0b2dldGhlclxuICAgICAqIEB0eXBlIHtbb2JqZWN0XX1cbiAgICAgKi9cbiAgICB2YXIgb3B0aW9ucyA9IHV0aWxzLm1lcmdlT3B0aW9ucyhvcHRzLCBkZWZhdWx0T3B0aW9ucywgc2VsZik7XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGZvciBoYW5kbGluZyB0aGUgYXN5bmMgZmlsZXJlYWRlciByZXNwb25zZVxuICAgICAqIEBwYXJhbSAge1tzdHJpbmddfSBlcnIgICAgIFt0aGUgZXJyb3JtZXNzYWdlIHdoaWNoIGdldHMgdGhyb3duIHdoZW4gdGhlIGZpbGVyZWFkZXIgZXJyb3JlZF1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZU9iaiBbdGhlIGJhc2U2NCBzdHJpbmcgJiBhbGwgbWV0YWRhdGEgY29tYmluZWQgaW4gb25lIG9iamVjdF1cbiAgICAgKi9cbiAgICB2YXIgY29udmVydEJhc2U2NEZpbGVIYW5kbGVyID0gZnVuY3Rpb24gKGVyciwgZmlsZU9iaikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpbGVPYmopIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVIYW5kbGVyID0gdXRpbHMuYWRkQmFzZTY0VG9Eb20oZmlsZU9iaiwgZm9ybSk7XG4gICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSB1dGlscy5nZXRSZWFkYWJsZUZpbGVUeXBlKHV0aWxzLmdldEZpbGVUeXBlKGZpbGVPYmouZmlsZSksIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGxpc3RFbGVtZW50ID0gdXRpbHMuY3JlYXRlTGlzdEVsZW1lbnQoZmlsZU9iai5maWxlLm5hbWUsIHV0aWxzLmdldFJlYWRhYmxlRmlsZVNpemUoZmlsZU9iai5maWxlKSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgdXRpbHMuYWRkRmlsZVRvVmlldyhmaWxlT2JqLCByZW1vdmVIYW5kbGVyLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCk7XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5oYXNGaWxlUmVhZGVyKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuYWRkVGh1bWJuYWlsKGZpbGVPYmouZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICBpZiAoIXV0aWxzLnZhbGlkYXRlRmlsZU51bWJlcih0cmFja0RhdGEsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlTnVtYmVyRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV0aWxzLnZhbGlkYXRlUmVxdWVzdFNpemUodHJhY2tEYXRhLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubWF4UmVxdWVzdFNpemVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXRpbHMudmFsaWRhdGVGaWxlVHlwZSh1dGlscy5nZXRGaWxlVHlwZShmaWxlKSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmludmFsaWRGaWxlVHlwZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dGlscy52YWxpZGF0ZUZpbGVTaXplKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlU2l6ZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dGlscy52YWxpZGF0ZUZpbGVOYW1lKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZhbGlkRmlsZU5hbWVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbY29udmVydHMgdGhlIGZpbGVkYXRhIGludG8gYSBiYXNlNjQgc3RyaW5nIGFuZCB2YWxpZGF0ZXMgdGhlIGZpbGVkYXRhXVxuICAgICAqIEBwYXJhbSAge1thcnJheV19ICBmaWxlcyAgW3RoZSBjb252ZXJ0ZWQgZmlsZUxpc3RPYmplY3RdXG4gICAgICovXG4gICAgdGhpcy5jb252ZXJ0RmlsZXNUb0Jhc2U2NCA9IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICBmaWxlcy5ldmVyeShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsaWRhdGVGaWxlKGZpbGUpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNob3dFcnJvck1lc3NhZ2UodmFsaWRhdGVGaWxlKGZpbGUpLCBlcnJvclRpbWVvdXRJZCwgdXRpbHMucmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHV0aWxzLnRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuXG4gICAgICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlcihudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGV2ZW50LnRhcmdldC5yZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuY29udmVydEJhc2U2NEZpbGVIYW5kbGVyKG9wdGlvbnMudW5rbm93bkZpbGVSZWFkZXJFcnJvcik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW0FkZCBhIGZpbGVJbnB1dCB3aXRoIHRoZSBzZWxlY3RlZCBmaWxlIHRvIGZvcm1dXG4gICAgICovXG4gICAgdGhpcy5hZGRTZWxlY3RlZEZpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmaWxlSW5wdXQgPSB1dGlscy5jcmVhdGVJbnB1dEVsZW1lbnQoZmlsZUlucHV0SWQpO1xuXG4gICAgICAgIGZvcm0uaW5zZXJ0QmVmb3JlKHNlbGVjdEJ1dHRvbiwgZHJvcEJveCk7XG4gICAgICAgIHNlbGVjdEJ1dHRvbi5hcHBlbmRDaGlsZChmaWxlSW5wdXQpO1xuXG4gICAgICAgIGZpbGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1dGlscy5yZW1vdmVFcnJvcnMoZXJyb3JXcmFwcGVyKTtcblxuICAgICAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmZpbGVzWzBdO1xuXG4gICAgICAgICAgICB2YXIgZmlsZU9iaiA9IHtcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB1dGlscy51bnRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuICAgICAgICAgICAgICAgIGZpbGVJbnB1dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZpbGVJbnB1dCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbGlkYXRlRmlsZShmaWxlKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5zaG93RXJyb3JNZXNzYWdlKHZhbGlkYXRlRmlsZShmaWxlKSwgb3B0aW9ucy5lcnJvclRpbWVvdXRJZCwgdXRpbHMucmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBmaWxlSW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSB1dGlscy5nZXRSZWFkYWJsZUZpbGVUeXBlKHV0aWxzLmdldEZpbGVUeXBlKGZpbGUpLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdEVsZW1lbnQgPSB1dGlscy5jcmVhdGVMaXN0RWxlbWVudChmaWxlLm5hbWUsIGZpbGVUeXBlLCB1dGlscy5nZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSkpO1xuXG4gICAgICAgICAgICAgICAgdXRpbHMudHJhY2tGaWxlKGZpbGUsIHRyYWNrRGF0YSk7XG4gICAgICAgICAgICAgICAgdXRpbHMuYWRkRmlsZVRvVmlldyhmaWxlT2JqLCByZW1vdmVIYW5kbGVyLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXRpbHMuaGFzRmlsZVJlYWRlcikge1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5hZGRUaHVtYm5haWwoZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZpbGVJbnB1dHMuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5hZGRTZWxlY3RlZEZpbGUoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGRyb3BoYW5kbGVyIGNhbGxzIHRoZSBkbmRIYW5kbGVyIGFsd2F5cyB3aGVubiBhIGZpbGUgZ2V0cyBkcm9wcGVkXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuICAgIGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB1dGlscy5ub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICAgICAgdmFyIGZpbGVzID0gdXRpbHMudG9BcnJheShldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuICAgICAgICBzZWxmLmNvbnZlcnRGaWxlc1RvQmFzZTY0KGZpbGVzKTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuICAgIGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGVyZSBpcyBubyBmaWxlcmVhZGVyIGF2YWlsYWJsZSwgdGhlbiB0aGUgZHJvcHpvbmUgc2hvdWxkIG5vdCBiZSBkaXNwbGF5ZWQgYW5kIHRoZSBGYWxsYmFjayBpcyBkaXNwbGF5ZWRcbiAgICAgKi9cbiAgICBpZiAoIXV0aWxzLmhhc0ZpbGVSZWFkZXIoKSAmJiBvcHRpb25zLmZhbGxiYWNrRm9ySUU4KSB7XG4gICAgICAgIHNlbGVjdEJ1dHRvbi5jbGFzc05hbWUgPSAnc2VsZWN0YnV0dG9uIGpzX3NlbGVjdGJ1dHRvbic7XG5cbiAgICAgICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uaW5uZXJIVE1MID0gJ1NlbGVjdCBGaWxlJztcblxuICAgICAgICBzZWxlY3RCdXR0b24uYXBwZW5kQ2hpbGQoc3Bhbik7XG5cbiAgICAgICAgc2VsZi5hZGRTZWxlY3RlZEZpbGUoKTtcbiAgICAgICAgZHJvcEJveC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRm9ybUZpbGVVcGxvYWQ7XG5cbi8qIGdsb2JhbCAkLCBGb3JtRmlsZVVwbG9hZCAqL1xuXG4kLmZuLmZvcm1GaWxlVXBsb2FkID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluc3RhbmNlT3B0aW9ucztcblxuICAgICAgICBpZiAoISQuZGF0YSh0aGlzLCAnZm9ybUZpbGVVcGxvYWQnKSkge1xuICAgICAgICAgICAgaW5zdGFuY2VPcHRpb25zID0gJC5leHRlbmQoe30sIG9wdGlvbnMsICQodGhpcykuZGF0YSgpKTtcbiAgICAgICAgICAgICQuZGF0YSh0aGlzLCAnZm9ybUZpbGVVcGxvYWQnLCBuZXcgRm9ybUZpbGVVcGxvYWQodGhpcywgaW5zdGFuY2VPcHRpb25zKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG4iLCIvKiBnbG9iYWwgd2luZG93LCBkb2N1bWVudCwgRmlsZVJlYWRlciwgSW1hZ2UgKi9cblxuLyoqXG4gKiBbZXh0cmFjdERPTU5vZGVzIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBvYmogW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgZXh0cmFjdERPTU5vZGVzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBvYmpbMF07XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbi8qKlxuICogW3RvQXJyYXkgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9iamVjdCBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciB0b0FycmF5ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmplY3QsIDApO1xufTtcblxuLyoqXG4gKiBbaGFzRmlsZVJlYWRlciBkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59IFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGhhc0ZpbGVSZWFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuRmlsZVJlYWRlcik7XG59O1xuXG4vKipcbiAqIFtub1Byb3BhZ2F0aW9uIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBub1Byb3BhZ2F0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgcmV0dXJuIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFttZXJnZU9wdGlvbnMgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9wdHMgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZGVmYXVsdG9wdGlvbnMgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBtZXJnZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0cywgZGVmYXVsdE9wdGlvbnMsIHNlbGYpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSBpbiBkZWZhdWx0T3B0aW9ucykge1xuICAgICAgICBpZiAob3B0cyAmJiBvcHRzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBvcHRpb25zW2ldID0gb3B0c1tpXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAob3B0aW9uc1tpXSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zW2ldID0gb3B0aW9uc1tpXS5iaW5kKHNlbGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9uc1tpXSA9IGRlZmF1bHRPcHRpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBGaWxldHlwZVxuICogQHBhcmFtICB7W3R5cGVdfSBuYXRpdmVGaWxlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBnZXRGaWxlVHlwZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gRml4IGNocm9taXVtIGlzc3VlIDEwNTM4MjogRXhjZWwgKC54bHMpIEZpbGVSZWFkZXIgbWltZSB0eXBlIGlzIGVtcHR5LlxuICAgIGlmICgoL1xcLnhscyQvKS50ZXN0KGZpbGUubmFtZSkgJiYgIWZpbGUudHlwZSkge1xuICAgICAgICByZXR1cm4gJ2FwcGxpY2F0aW9uL3ZuZC5tcy1leGNlbCc7XG4gICAgfVxuICAgIHJldHVybiBmaWxlLnR5cGU7XG59O1xuXG4vKipcbiAqIFRha2VzIHRoZSBuYXRpdmUgZmlsZXNpemUgaW4gYnl0ZXMgYW5kIHJldHVybnMgdGhlIHByZXR0aWZpZWQgZmlsZXNpemVcbiAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlIFtjb250YWlucyB0aGUgc2l6ZSBvZiB0aGUgZmlsZV1cbiAqIEByZXR1cm4ge1tzdHJpbmddfSAgICAgIFtwcmV0dGlmaWVkIGZpbGVzaXplXVxuICovXG52YXIgZ2V0UmVhZGFibGVGaWxlU2l6ZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHNpemUgPSBmaWxlLnNpemU7XG4gICAgdmFyIHN0cmluZztcblxuICAgIGlmIChzaXplID49IDEwMjQgKiAxMDI0ICogMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ1RCJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQgKiAxMDI0KSB7XG4gICAgICAgIHNpemUgPSBzaXplIC8gKDEwMjQgKiAxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ0dCJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgLyAxMCk7XG4gICAgICAgIHN0cmluZyA9ICdNQic7XG4gICAgfSBlbHNlIGlmIChzaXplID49IDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ0tCJztcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaXplID0gc2l6ZSAqIDEwO1xuICAgICAgICBzdHJpbmcgPSAnQic7XG4gICAgfVxuXG4gICAgcmV0dXJuIChNYXRoLnJvdW5kKHNpemUpIC8gMTApICsgJyAnICsgc3RyaW5nO1xufTtcblxuLyoqXG4gKiBbaXNJbWFnZSBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gIGZpbGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBpc0ltYWdlID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gKC9eaW1hZ2VcXC8vKS50ZXN0KGdldEZpbGVUeXBlKGZpbGUpKTtcbn07XG5cbi8qKlxuICogW2luY3JlbWVudCB0aGUgZmlsZW51bWJlciBmb3IgZWFjaCBkcm9wcGVkIGZpbGUgYnkgb25lICYgaW5jcmVtZW50IHRoZSByZXF1ZXN0c2l6ZSBieSB0aGUgY3VycmVudCBmaWxlc2l6ZV1cbiAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlXG4gKiBAcGFyYW0gIHtbb2JqZWN0XX0gdHJhY2tEYXRhXG4gKi9cbnZhciB0cmFja0ZpbGUgPSBmdW5jdGlvbiAoZmlsZSwgdHJhY2tEYXRhKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdHJhY2tEYXRhLmZpbGVOdW1iZXIgKz0gMTtcbiAgICB0cmFja0RhdGEucmVxdWVzdFNpemUgKz0gZmlsZS5zaXplO1xufTtcblxuLyoqXG4gKiBbZGVjcmVtZW50IHRoZSBmaWxlbnVtYmVyIGZvciBlYWNoIGRlbGV0ZWQgZmlsZSBieSBvbmUgJiBkZWNyZW1lbnQgdGhlIHJlcXVlc3RzaXplIGJ5IHRoZSBjdXJyZW50IGZpbGVzaXplXVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGVcbiAqIEBwYXJhbSAge1tvYmplY3RdfSB0cmFja0RhdGFcbiAqL1xudmFyIHVudHJhY2tGaWxlID0gZnVuY3Rpb24gKGZpbGUsIHRyYWNrRGF0YSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHRyYWNrRGF0YS5maWxlTnVtYmVyIC09IDE7XG4gICAgdHJhY2tEYXRhLnJlcXVlc3RTaXplIC09IGZpbGUuc2l6ZTtcbn07XG5cbi8qKlxuICogW3JldHVybnMgdGhlIHByZXR0aWZpZWQgZmlsZXN0eXBlIHN0cmluZyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIG9wdGlvbnNdXG4gKiBAcGFyYW0gIHtbc3RyaW5nXX0gZmlsZVR5cGUgW21pbWV0eXBlIG9mIGZpbGVdXG4gKiBAcmV0dXJuIHtbc3RyaW5nXX0gICAgICBbcHJldHRpZmllZCB0eXBlc3RyaW5nXVxuICovXG52YXIgZ2V0UmVhZGFibGVGaWxlVHlwZSA9IGZ1bmN0aW9uIChmaWxlVHlwZSwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiBvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdIHx8ICd1bmtub3duIGZpbGV0eXBlJztcbn07XG5cbnZhciB2YWxpZGF0ZUZpbGVOdW1iZXIgPSBmdW5jdGlvbiAodHJhY2tEYXRhLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgaWYgKHRyYWNrRGF0YS5maWxlTnVtYmVyID49IG9wdGlvbnMubWF4RmlsZU51bWJlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG52YXIgdmFsaWRhdGVSZXF1ZXN0U2l6ZSA9IGZ1bmN0aW9uIChyZXF1ZXN0U2l6ZSwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGlmIChyZXF1ZXN0U2l6ZSA+PSBvcHRpb25zLm1heFJlcXVlc3RTaXplKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbnZhciB2YWxpZGF0ZUZpbGVUeXBlID0gZnVuY3Rpb24gKGZpbGVUeXBlLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgaWYgKCFvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbnZhciB2YWxpZGF0ZUZpbGVTaXplID0gZnVuY3Rpb24gKGZpbGUsIG9wdGlvbnMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBpZiAoZmlsZS5zaXplID4gb3B0aW9ucy5tYXhGaWxlU2l6ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG52YXIgdmFsaWRhdGVGaWxlTmFtZSA9IGZ1bmN0aW9uIChmaWxlLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgaWYgKCEob3B0aW9ucy5maWxlTmFtZVJlKS50ZXN0KGZpbGUubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBbZGlzcGxheXMgdGhlIEVycm9yIG1lc3NhZ2UgJiByZW1vdmVzIGl0IGFsc28gYWZ0ZXIgdGhlIHNwZWNpZmllZCB0aW1lb3V0XVxuICogQHBhcmFtICB7W3N0cmluZ119IGVycm9yIFtlcnJvciBtZXNzYWdlIHdoaWNoIGhhcyB0byBiZSBkaXNwbGF5ZWRdXG4gKi9cbnZhciBzaG93RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24gKGVycm9yLCBlcnJvclRpbWVvdXRJZCwgcmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGVycm9yRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBlcnJvckVsZW1lbnQuY2xhc3NOYW1lID0gJ2Vycm9yJztcbiAgICBlcnJvckVsZW1lbnQuaW5uZXJIVE1MID0gZXJyb3I7XG5cbiAgICBjbGVhclRpbWVvdXQoZXJyb3JUaW1lb3V0SWQpO1xuXG4gICAgZXJyb3JUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmVtb3ZlRXJyb3JzKGVycm9yV3JhcHBlcik7XG4gICAgfSwgb3B0aW9ucy5lcnJvck1lc3NhZ2VUaW1lb3V0KTtcblxuICAgIGVycm9yV3JhcHBlci5hcHBlbmRDaGlsZChlcnJvckVsZW1lbnQpO1xuICAgIGZvcm0uaW5zZXJ0QmVmb3JlKGVycm9yV3JhcHBlciwgZmlsZVZpZXcpO1xufTtcblxuLyoqXG4gKiBbcmVtb3ZlcyBhbGwgZXJyb3JzXVxuICovXG52YXIgcmVtb3ZlRXJyb3JzID0gZnVuY3Rpb24gKGVycm9yV3JhcHBlcikge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGVycm9yV3JhcHBlci5pbm5lckhUTUwgPSAnJztcbn07XG5cbi8qKlxuICogW2lmIHBvc3NpYmxlIGFkZHMgYSB0aHVtYm5haWwgb2YgdGhlIGdpdmVuIGZpbGUgdG8gdGhlIERPTV1cbiAqIEBwYXJhbSB7W29iamVjdF19ICAgICBmaWxlICAgIFtmaWxlZGF0YSB0byBjcmVhdGUgYSB0aHVtYm5haWwgd2hpY2ggZ2V0cyBpbmplY3RlZF1cbiAqIEBwYXJhbSB7W0RPTSBvYmplY3RdfSBlbGVtZW50IFtET00gZWxlbWVudCB0byBzcGVjaWZ5IHdoZXJlIHRoZSB0aHVtYm5haWwgaGFzIHRvIGJlIGluamVjdGVkXVxuICovXG52YXIgYWRkVGh1bWJuYWlsID0gZnVuY3Rpb24gKGZpbGUsIGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgRU1QVFlfSU1BR0UgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFBRUFBQUFCQVFNQUFBQWwyMWJLQUFBQUExQk1WRVVBQUFDbmVqM2FBQUFBQVhSU1RsTUFRT2JZWmdBQUFBcEpSRUZVQ05kallBQUFBQUlBQWVJaHZETUFBQUFBU1VWT1JLNUNZSUk9JztcblxuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIHZhciBmYWN0b3IgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbiAgICB2YXIgaW1nV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgIGNhbnZhcy53aWR0aCAgPSBvcHRpb25zLnRodW1ibmFpbFNpemUgKiBmYWN0b3I7XG4gICAgY2FudmFzLmhlaWdodCA9IG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3RvcjtcblxuICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmIChmYWN0b3IgPiAxKSB7XG4gICAgICAgIGN0eC53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvID0gZmFjdG9yO1xuICAgICAgICBjdHguc2NhbGUoZmFjdG9yLCBmYWN0b3IpO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmpzX25hbWUnKTtcbiAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWdXcmFwcGVyLmNsYXNzTmFtZSA9ICd0aHVtYm5haWwnO1xuXG4gICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJhdGlvID0gdGhpcy5oZWlnaHQgLyB0aGlzLndpZHRoO1xuXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggKiByYXRpbztcbiAgICAgICAgY3R4LmRyYXdJbWFnZSh0aGlzLCAwLCAwLCBvcHRpb25zLnRodW1ibmFpbFNpemUsIG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIHJhdGlvKTtcbiAgICB9KTtcblxuICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChpc0ltYWdlKGZpbGUpKSB7XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gRU1QVFlfSU1BR0U7XG4gICAgICAgIH1cblxuICAgICAgICBpbWdXcmFwcGVyLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICAgIGVsZW1lbnQuaW5zZXJ0QmVmb3JlKGltZ1dyYXBwZXIsIGZpbGVOYW1lKTtcbiAgICB9KTtcblxuICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xufTtcblxuLyoqXG4gKiBbQ3JlYXRlcyBhIGxpc3RFbGVtZW50IHdpdGggdGhlIGRhdGEgb2YgdGhlIHBhc3NlZCBvYmplY3RdXG4gKiBAcGFyYW0gIHtbdHlwZV19IGZpbGVPYmogW3VzZWQgdG8gcHV0IHRoZSBpbmZvcm1hdGlvbiBvZiB0aGUgZmlsZSBpbiB0aGUgbGlzdEVsZW1lbXRdXG4gKiBAcmV0dXJuIHtbb2JqZWN0XX0gICAgICAgW3RoZSBsaXN0RWxlbWVudCB3aGljaCBnZXRzIGluamVjdGVkIGluIHRoZSBET01dXG4gKi9cbnZhciBjcmVhdGVMaXN0RWxlbWVudCA9IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVNpemUsIGZpbGVUeXBlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGZpbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBmaWxlRWxlbWVudC5jbGFzc05hbWUgPSAnZmlsZSc7XG5cbiAgICBmaWxlRWxlbWVudC5pbm5lckhUTUwgPSBbXG4gICAgJzxzcGFuIGNsYXNzPVwibGFiZWwganNfbmFtZSBuYW1lXCI+JyxcbiAgICBmaWxlTmFtZSxcbiAgICAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibGFiZWwgc2l6ZVwiPicsXG4gICAgZmlsZVNpemUsXG4gICAgJzwvc3Bhbj48c3BhbiBjbGFzcz1cImxhYmVsIHR5cGVcIj4nLFxuICAgIGZpbGVUeXBlLFxuICAgICc8L3NwYW4+JyBdLmpvaW4oJycpO1xuXG4gICAgcmV0dXJuIGZpbGVFbGVtZW50O1xufTtcblxuLyoqXG4gKiBbQ3JlYXRlcyBhIGxpc3QgaXRlbSB3aGljaCBnZXRzIGluamVjdGVkIHRvIHRoZSBET01dXG4gKiBAcGFyYW0ge1tvYmplY3RdfSBmaWxlT2JqICAgICAgICAgICAgIFtmaWxlZGF0YSBmb3IgYWRkaW5nIHRoZSBmaWxlZGF0YSAmIHByZXZpZXcgdG8gdGhlIERPTV1cbiAqIEBwYXJhbSB7W2Z1bmN0aW9uXX0gcmVtb3ZlRmlsZUhhbmRsZXIgW2NhbGxiYWNrIGZvciBub3RpZnlpbmcgdGhhdCB0aGUgc3BlY2lmaWVkIGZpbGUgd2FzIGRlbGV0ZWRdXG4gKi9cbnZhciBhZGRGaWxlVG9WaWV3ID0gZnVuY3Rpb24gKGZpbGVPYmosIHJlbW92ZUZpbGVIYW5kbGVyQ2FsbGJhY2ssIHRyYWNrRGF0YSwgZmlsZVZpZXcsIGxpc3RFbGVtZW50KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gQWRkIHJlbW92ZSBFbGVtZW50ICYgcmVnaXN0ZXIgcmVtb3ZlIEhhbmRsZXJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlbW92ZUJ1dHRvbi5jbGFzc05hbWUgPSAncmVtb3ZlJztcbiAgICBsaXN0RWxlbWVudC5hcHBlbmRDaGlsZChyZW1vdmVCdXR0b24pO1xuXG4gICAgZmlsZVZpZXcuYXBwZW5kQ2hpbGQobGlzdEVsZW1lbnQpO1xuXG4gICAgcmVtb3ZlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjYWxscyB0aGUgY2FsbGJhY2sgb2YgdGhlIERORCBIYW5kbGVyXG4gICAgICAgIHJlbW92ZUZpbGVIYW5kbGVyQ2FsbGJhY2sodHJhY2tEYXRhKTtcblxuICAgICAgICAvLyByZW1vdmUgZmlsZVZpZXdFbGVtZW50XG4gICAgICAgIGxpc3RFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobGlzdEVsZW1lbnQpO1xuXG4gICAgICAgIHVudHJhY2tGaWxlKGZpbGVPYmouZmlsZSwgdHJhY2tEYXRhKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogW0NyZWF0ZXMgYSBoaWRkZW4gaW5wdXQgZmllbGQgd2hlcmUgdGhlIGJhc2U2NCBkYXRhIGlzIHN0b3JlZF1cbiAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlT2JqIFt0aGUgYmFzZTY0IHN0cmluZyAmIGFsbCBtZXRhZGF0YSBjb21iaW5lZCBpbiBvbmUgb2JqZWN0XVxuICovXG52YXIgYWRkQmFzZTY0VG9Eb20gPSBmdW5jdGlvbiAoZmlsZU9iaiwgZm9ybSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICBpbnB1dC50eXBlID0gJ2hpZGRlbic7XG4gICAgaW5wdXQudmFsdWUgPSBmaWxlT2JqLmRhdGE7XG4gICAgaW5wdXQubmFtZSA9ICdmaWxlOicgKyBmaWxlT2JqLmZpbGUubmFtZTtcblxuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dCk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogW2NyZWF0ZUlucHV0RWxlbWVudCBkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgY3JlYXRlSW5wdXRFbGVtZW50ID0gZnVuY3Rpb24gKGZpbGVJbnB1dElkKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGZpbGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICBmaWxlSW5wdXQudHlwZSA9ICdmaWxlJztcbiAgICBmaWxlSW5wdXQuY2xhc3NOYW1lID0gJ2ZpbGVpbnB1dCc7XG4gICAgZmlsZUlucHV0SWQgKz0gMTtcblxuICAgIGZpbGVJbnB1dC5uYW1lID0gJ2ZpbGVJbnB1dCAnICsgZmlsZUlucHV0SWQ7XG5cbiAgICByZXR1cm4gZmlsZUlucHV0O1xufTtcblxuZXhwb3J0cy5leHRyYWN0RE9NTm9kZXMgICAgID0gZXh0cmFjdERPTU5vZGVzO1xuZXhwb3J0cy50b0FycmF5ICAgICAgICAgICAgID0gdG9BcnJheTtcbmV4cG9ydHMuaGFzRmlsZVJlYWRlciAgICAgICA9IGhhc0ZpbGVSZWFkZXI7XG5leHBvcnRzLm5vUHJvcGFnYXRpb24gICAgICAgPSBub1Byb3BhZ2F0aW9uO1xuZXhwb3J0cy5tZXJnZU9wdGlvbnMgICAgICAgID0gbWVyZ2VPcHRpb25zO1xuZXhwb3J0cy5nZXRGaWxlVHlwZSAgICAgICAgID0gZ2V0RmlsZVR5cGU7XG5leHBvcnRzLmdldFJlYWRhYmxlRmlsZVNpemUgPSBnZXRSZWFkYWJsZUZpbGVTaXplO1xuZXhwb3J0cy5pc0ltYWdlICAgICAgICAgICAgID0gaXNJbWFnZTtcbmV4cG9ydHMuYWRkQmFzZTY0VG9Eb20gICAgICA9IGFkZEJhc2U2NFRvRG9tO1xuZXhwb3J0cy5jcmVhdGVJbnB1dEVsZW1lbnQgID0gY3JlYXRlSW5wdXRFbGVtZW50O1xuZXhwb3J0cy5yZW1vdmVFcnJvcnMgICAgICAgID0gcmVtb3ZlRXJyb3JzO1xuZXhwb3J0cy50cmFja0ZpbGUgICAgICAgICAgID0gdHJhY2tGaWxlO1xuZXhwb3J0cy51bnRyYWNrRmlsZSAgICAgICAgID0gdW50cmFja0ZpbGU7XG5leHBvcnRzLmdldFJlYWRhYmxlRmlsZVR5cGUgPSBnZXRSZWFkYWJsZUZpbGVUeXBlO1xuZXhwb3J0cy52YWxpZGF0ZUZpbGVOdW1iZXIgID0gdmFsaWRhdGVGaWxlTnVtYmVyO1xuZXhwb3J0cy52YWxpZGF0ZVJlcXVlc3RTaXplID0gdmFsaWRhdGVSZXF1ZXN0U2l6ZTtcbmV4cG9ydHMudmFsaWRhdGVGaWxlVHlwZSAgICA9IHZhbGlkYXRlRmlsZVR5cGU7XG5leHBvcnRzLnZhbGlkYXRlRmlsZVNpemUgICAgPSB2YWxpZGF0ZUZpbGVTaXplO1xuZXhwb3J0cy52YWxpZGF0ZUZpbGVOYW1lICAgID0gdmFsaWRhdGVGaWxlTmFtZTtcbmV4cG9ydHMuc2hvd0Vycm9yTWVzc2FnZSAgICA9IHNob3dFcnJvck1lc3NhZ2U7XG5leHBvcnRzLmNyZWF0ZUxpc3RFbGVtZW50ICAgPSBjcmVhdGVMaXN0RWxlbWVudDtcbmV4cG9ydHMuYWRkVGh1bWJuYWlsICAgICAgICA9IGFkZFRodW1ibmFpbDtcbmV4cG9ydHMuYWRkRmlsZVRvVmlldyAgICAgICA9IGFkZEZpbGVUb1ZpZXc7XG5leHBvcnRzLmFkZEJhc2U2NFRvRG9tICAgICAgPSBhZGRCYXNlNjRUb0RvbTtcbmV4cG9ydHMuY3JlYXRlSW5wdXRFbGVtZW50ICA9IGNyZWF0ZUlucHV0RWxlbWVudDtcbiJdfQ==
