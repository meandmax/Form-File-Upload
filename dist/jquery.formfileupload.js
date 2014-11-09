(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* globals document, FileReader */

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

/* globals $, FormFileUpload */

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
/* globals window, document, FileReader, Image */

/**
 * [extractDOMNodes description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
exports.extractDOMNodes = function (obj) {
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
exports.toArray = function (object) {
    'use strict';

    return Array.prototype.slice.call(object, 0);
};

/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
exports.hasFileReader = function () {
    'use strict';

    return !!(window.File && window.FileList && window.FileReader);
};

/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
exports.noPropagation = function (e) {
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
exports.mergeOptions = function (opts, defaultOptions, self) {
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
exports.getFileType = function (file) {
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
exports.getReadableFileSize = function (file) {
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
exports.isImage = function (file) {
    'use strict';

    return (/^image\//).test(exports.getFileType(file));
};

/**
 * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
exports.trackFile = function (file, trackData) {
    'use strict';

    trackData.fileNumber += 1;
    trackData.requestSize += file.size;
};

/**
 * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
 * @param  {[object]} file
 * @param  {[object]} trackData
 */
exports.untrackFile = function (file, trackData) {
    'use strict';

    trackData.fileNumber -= 1;
    trackData.requestSize -= file.size;
};

/**
 * [returns the prettified filestype string based on the specified options]
 * @param  {[string]} fileType [mimetype of file]
 * @return {[string]}      [prettified typestring]
 */
exports.getReadableFileType = function (fileType, options) {
    'use strict';

    return options.acceptedTypes[fileType] || 'unknown filetype';
};

exports.validateFileNumber = function (trackData, options) {
    'use strict';

    if (trackData.fileNumber >= options.maxFileNumber) {
        return false;
    }

    return true;
};

exports.validateRequestSize = function (requestSize, options) {
    'use strict';

    if (requestSize >= options.maxRequestSize) {
        return false;
    }

    return true;
};

exports.validateFileType = function (fileType, options) {
    'use strict';

    if (!options.acceptedTypes[fileType]) {
        return false;
    }

    return true;
};

exports.validateFileSize = function (file, options) {
    'use strict';

    if (file.size > options.maxFileSize) {
        return false;
    }

    return true;
};

exports.validateFileName = function (file, options) {
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
exports.showErrorMessage = function (error, errorTimeoutId, removeErrors, errorWrapper, form, fileView, options) {
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
exports.removeErrors = function (errorWrapper) {
    'use strict';

    errorWrapper.innerHTML = '';
};

/**
 * [if possible adds a thumbnail of the given file to the DOM]
 * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
 * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
 */
exports.addThumbnail = function (file, element, options) {
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
        if (exports.isImage(file)) {
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
exports.createListElement = function (fileName, fileSize, fileType) {
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
exports.addFileToView = function (fileObj, removeFileHandlerCallback, trackData, fileView, listElement) {
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

        exports.untrackFile(fileObj.file, trackData);
    });
};

/**
 * [Creates a hidden input field where the base64 data is stored]
 * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
 */
exports.addBase64ToDom = function (fileObj, form) {
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
exports.createInputElement = function (fileInputId) {
    'use strict';

    var fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.className = 'fileinput';
    fileInputId += 1;

    fileInput.name = 'fileInput ' + fileInputId;

    return fileInput;
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvZmFrZV9lNjQ2NmU2MS5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL2Zvcm1maWxldXBsb2FkdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9UQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGdsb2JhbHMgZG9jdW1lbnQsIEZpbGVSZWFkZXIgKi9cblxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi9mb3JtZmlsZXVwbG9hZHV0aWxzLmpzJyk7XG5cbnZhciBGb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChmaWxlVXBsb2FkXywgb3B0cykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBlcnJvclRpbWVvdXRJZDtcbiAgICB2YXIgZmlsZUlucHV0SWQgPSAwO1xuXG4gICAgdmFyIHRyYWNrRGF0YSA9IHtcbiAgICAgICAgZmlsZU51bWJlcjogMCxcbiAgICAgICAgcmVxdWVzdFNpemU6IDBcbiAgICB9O1xuXG4gICAgdmFyIHNlbGYgICAgICAgICA9IHRoaXM7XG4gICAgdmFyIGRyb3BCb3ggICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19kcm9wYm94Jyk7XG4gICAgdmFyIGZpbGVWaWV3ICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19saXN0Jyk7XG4gICAgdmFyIGZpbGVJbnB1dHMgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19maWxlaW5wdXRzJyk7XG4gICAgdmFyIGZvcm0gICAgICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19mb3JtJyk7XG4gICAgdmFyIGVycm9yV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBzZWxlY3RCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogW3RpbWVvdXQgc3BlY2lmaWVzIGhvdyBsb25nIHRoZSBlcnJvciBtZXNzYWdlcyBhcmUgZGlzcGxheWVkXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3JNZXNzYWdlVGltZW91dDogNTAwMCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW3RoZSBtYXhpbXVtIGZpbGVzaXplIG9mIGVhY2ggZmlsZSBpbiBieXRlc11cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVTaXplOiAzMTQ1NzI4LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbbWF4RmlsZU51bWJlciBkZWZpbmVzIGhvdyBtYW55IGZpbGVzIGFyZSBhbGxvd2VkIHRvIHVwbG9hZCB3aXRoIGVhY2ggcmVxdWVzdF1cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVOdW1iZXI6IDMsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtTaXplIG9mIHRodW1ibmFpbHMgZGlzcGxheWVkIGluIHRoZSBicm93c2VyIGZvciBwcmV2aWV3IHRoZSBpbWFnZXNdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aHVtYm5haWxTaXplOiAxMDAsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtkZWZpbmVzIHRoZSBtYXhpbXVtIHNpemUgb2YgZWFjaCByZXF1ZXN0IGluIGJ5dGVzXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4UmVxdWVzdFNpemU6IDk0MzcxODQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtJZiB0cnVlIHRoZSBmYWxsYmFjayBmb3IgSUU4IGlzIGFjdGl2YXRlZF1cbiAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmYWxsYmFja0ZvcklFODogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW1JlZ3VsYXIgRXhwcmVzc2lvbiBmb3IgZmlsZW5hbWUgbWF0Y2hpbmddXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWxlTmFtZVJlOiAvXltBLVphLXowLTkuXFwtXyBdKyQvLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBmaWxlIGhhcyBjaGFyYWN0ZXJzIHdoaWNoIGFyZSBub3QgYWxsb3dlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGludmFsaWRGaWxlTmFtZUVycm9yOiAnVGhlIG5hbWUgb2YgdGhlIGZpbGUgaGFzIGZvcmJpZGRlbiBjaGFyYWN0ZXJzJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgZmlsZXR5cGUgaXMgbm90IGFsbG93ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpbnZhbGlkRmlsZVR5cGVFcnJvcjogJ1RoZSBmaWxlZm9ybWF0IGlzIG5vdCBhbGxvd2VkJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgbWF4LiByZXF1ZXN0c2l6ZSBpcyByZWFjaGVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4UmVxdWVzdFNpemVFcnJvcjogJ1RoZSByZXF1ZXN0c2l6ZSBvZiB0aGUgZmlsZXMgeW91IHdhbnQgdG8gdXBsb2FkIGlzIGV4Y2VlZGVkLicsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gZmlsZW51bWJlciBpcyByZWFjaGVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4RmlsZU51bWJlckVycm9yOiAnWW91IGNhbiB1cGxvYWQgMyBmaWxlcywgbm90IG1vcmUhJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgbWF4LiBmaWxlbnNpemUgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVTaXplRXJyb3I6ICdPbmUgb2YgdGhlIGZpbGVzIGlzIHRvbyBsYXJnZS4gdGhlIG1heGltdW0gZmlsZXNpemUgaXMgMyBNQi4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbSWYgc29tZXRoaW5nIGR1cmluZyB0aGUgZmlsZXJlYWRpbmcgcHJvY2VzcyB3ZW50IHdyb25nLCB0aGVuIHRoaXMgbWVzc2FnZSBpcyBkaXNwbGF5ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1bmtub3duRmlsZVJlYWRlckVycm9yOiAnVW5rbm93biBFcnJvciB3aGlsZSBsb2FkaW5nIHRoZSBmaWxlLicsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtPYmplY3RzIGNvbnRhaW5zIGFsbCBhbGxvd2VkIG1pbWV0eXBlcyBhcyBrZXlzICYgdGhlIHByZXR0aWZpZWQgZmlsZW5hbWVzIGFzIHZhbHVlc11cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGFjY2VwdGVkVHlwZXM6IHtcbiAgICAgICAgICAgICdpbWFnZS9wbmcnOiAnUE5HLUJpbGQnLFxuICAgICAgICAgICAgJ2ltYWdlL2pwZWcnOiAnSlBFRy1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS9naWYnOiAnR0lGLUJpbGQnLFxuICAgICAgICAgICAgJ2ltYWdlL3RpZmYnOiAnVElGRi1CaWxkJyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9wZGYnOiAnUERGLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnOiAnRXhjZWwtRG9rdW1lbnQnLFxuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0JzogJ0V4Y2VsLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9tc3dvcmQnOiAnV29yZC1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQnOiAnV29yZC1Eb2t1bWVudCdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNZXJnaW5nIHRoZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgdXNlciBwYXNzZWQgb3B0aW9ucyB0b2dldGhlclxuICAgICAqIEB0eXBlIHtbb2JqZWN0XX1cbiAgICAgKi9cbiAgICB2YXIgb3B0aW9ucyA9IHV0aWxzLm1lcmdlT3B0aW9ucyhvcHRzLCBkZWZhdWx0T3B0aW9ucywgc2VsZik7XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGZvciBoYW5kbGluZyB0aGUgYXN5bmMgZmlsZXJlYWRlciByZXNwb25zZVxuICAgICAqIEBwYXJhbSAge1tzdHJpbmddfSBlcnIgICAgIFt0aGUgZXJyb3JtZXNzYWdlIHdoaWNoIGdldHMgdGhyb3duIHdoZW4gdGhlIGZpbGVyZWFkZXIgZXJyb3JlZF1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZU9iaiBbdGhlIGJhc2U2NCBzdHJpbmcgJiBhbGwgbWV0YWRhdGEgY29tYmluZWQgaW4gb25lIG9iamVjdF1cbiAgICAgKi9cbiAgICB2YXIgY29udmVydEJhc2U2NEZpbGVIYW5kbGVyID0gZnVuY3Rpb24gKGVyciwgZmlsZU9iaikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpbGVPYmopIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVIYW5kbGVyID0gdXRpbHMuYWRkQmFzZTY0VG9Eb20oZmlsZU9iaiwgZm9ybSk7XG4gICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSB1dGlscy5nZXRSZWFkYWJsZUZpbGVUeXBlKHV0aWxzLmdldEZpbGVUeXBlKGZpbGVPYmouZmlsZSksIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGxpc3RFbGVtZW50ID0gdXRpbHMuY3JlYXRlTGlzdEVsZW1lbnQoZmlsZU9iai5maWxlLm5hbWUsIHV0aWxzLmdldFJlYWRhYmxlRmlsZVNpemUoZmlsZU9iai5maWxlKSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgdXRpbHMuYWRkRmlsZVRvVmlldyhmaWxlT2JqLCByZW1vdmVIYW5kbGVyLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCk7XG5cbiAgICAgICAgICAgIGlmICh1dGlscy5oYXNGaWxlUmVhZGVyKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuYWRkVGh1bWJuYWlsKGZpbGVPYmouZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICBpZiAoIXV0aWxzLnZhbGlkYXRlRmlsZU51bWJlcih0cmFja0RhdGEsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlTnVtYmVyRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXV0aWxzLnZhbGlkYXRlUmVxdWVzdFNpemUodHJhY2tEYXRhLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubWF4UmVxdWVzdFNpemVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXRpbHMudmFsaWRhdGVGaWxlVHlwZSh1dGlscy5nZXRGaWxlVHlwZShmaWxlKSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmludmFsaWRGaWxlVHlwZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dGlscy52YWxpZGF0ZUZpbGVTaXplKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlU2l6ZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF1dGlscy52YWxpZGF0ZUZpbGVOYW1lKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZhbGlkRmlsZU5hbWVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbY29udmVydHMgdGhlIGZpbGVkYXRhIGludG8gYSBiYXNlNjQgc3RyaW5nIGFuZCB2YWxpZGF0ZXMgdGhlIGZpbGVkYXRhXVxuICAgICAqIEBwYXJhbSAge1thcnJheV19ICBmaWxlcyAgW3RoZSBjb252ZXJ0ZWQgZmlsZUxpc3RPYmplY3RdXG4gICAgICovXG4gICAgdGhpcy5jb252ZXJ0RmlsZXNUb0Jhc2U2NCA9IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICBmaWxlcy5ldmVyeShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsaWRhdGVGaWxlKGZpbGUpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHV0aWxzLnNob3dFcnJvck1lc3NhZ2UodmFsaWRhdGVGaWxlKGZpbGUpLCBlcnJvclRpbWVvdXRJZCwgdXRpbHMucmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHV0aWxzLnRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuXG4gICAgICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlcihudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGV2ZW50LnRhcmdldC5yZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdXRpbHMuY29udmVydEJhc2U2NEZpbGVIYW5kbGVyKG9wdGlvbnMudW5rbm93bkZpbGVSZWFkZXJFcnJvcik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW0FkZCBhIGZpbGVJbnB1dCB3aXRoIHRoZSBzZWxlY3RlZCBmaWxlIHRvIGZvcm1dXG4gICAgICovXG4gICAgdGhpcy5hZGRTZWxlY3RlZEZpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmaWxlSW5wdXQgPSB1dGlscy5jcmVhdGVJbnB1dEVsZW1lbnQoZmlsZUlucHV0SWQpO1xuXG4gICAgICAgIGZvcm0uaW5zZXJ0QmVmb3JlKHNlbGVjdEJ1dHRvbiwgZHJvcEJveCk7XG4gICAgICAgIHNlbGVjdEJ1dHRvbi5hcHBlbmRDaGlsZChmaWxlSW5wdXQpO1xuXG4gICAgICAgIGZpbGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB1dGlscy5yZW1vdmVFcnJvcnMoZXJyb3JXcmFwcGVyKTtcblxuICAgICAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmZpbGVzWzBdO1xuXG4gICAgICAgICAgICB2YXIgZmlsZU9iaiA9IHtcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB1dGlscy51bnRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuICAgICAgICAgICAgICAgIGZpbGVJbnB1dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZpbGVJbnB1dCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbGlkYXRlRmlsZShmaWxlKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5zaG93RXJyb3JNZXNzYWdlKHZhbGlkYXRlRmlsZShmaWxlKSwgb3B0aW9ucy5lcnJvclRpbWVvdXRJZCwgdXRpbHMucmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBmaWxlSW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSB1dGlscy5nZXRSZWFkYWJsZUZpbGVUeXBlKHV0aWxzLmdldEZpbGVUeXBlKGZpbGUpLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdEVsZW1lbnQgPSB1dGlscy5jcmVhdGVMaXN0RWxlbWVudChmaWxlLm5hbWUsIGZpbGVUeXBlLCB1dGlscy5nZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSkpO1xuXG4gICAgICAgICAgICAgICAgdXRpbHMudHJhY2tGaWxlKGZpbGUsIHRyYWNrRGF0YSk7XG4gICAgICAgICAgICAgICAgdXRpbHMuYWRkRmlsZVRvVmlldyhmaWxlT2JqLCByZW1vdmVIYW5kbGVyLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodXRpbHMuaGFzRmlsZVJlYWRlcikge1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5hZGRUaHVtYm5haWwoZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZpbGVJbnB1dHMuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5hZGRTZWxlY3RlZEZpbGUoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGRyb3BoYW5kbGVyIGNhbGxzIHRoZSBkbmRIYW5kbGVyIGFsd2F5cyB3aGVubiBhIGZpbGUgZ2V0cyBkcm9wcGVkXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuICAgIGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJvcCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB1dGlscy5ub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICAgICAgdmFyIGZpbGVzID0gdXRpbHMudG9BcnJheShldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuICAgICAgICBzZWxmLmNvbnZlcnRGaWxlc1RvQmFzZTY0KGZpbGVzKTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuICAgIGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdXRpbHMubm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGVyZSBpcyBubyBmaWxlcmVhZGVyIGF2YWlsYWJsZSwgdGhlbiB0aGUgZHJvcHpvbmUgc2hvdWxkIG5vdCBiZSBkaXNwbGF5ZWQgYW5kIHRoZSBGYWxsYmFjayBpcyBkaXNwbGF5ZWRcbiAgICAgKi9cbiAgICBpZiAoIXV0aWxzLmhhc0ZpbGVSZWFkZXIoKSAmJiBvcHRpb25zLmZhbGxiYWNrRm9ySUU4KSB7XG4gICAgICAgIHNlbGVjdEJ1dHRvbi5jbGFzc05hbWUgPSAnc2VsZWN0YnV0dG9uIGpzX3NlbGVjdGJ1dHRvbic7XG5cbiAgICAgICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgICAgIHNwYW4uaW5uZXJIVE1MID0gJ1NlbGVjdCBGaWxlJztcblxuICAgICAgICBzZWxlY3RCdXR0b24uYXBwZW5kQ2hpbGQoc3Bhbik7XG5cbiAgICAgICAgc2VsZi5hZGRTZWxlY3RlZEZpbGUoKTtcbiAgICAgICAgZHJvcEJveC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRm9ybUZpbGVVcGxvYWQ7XG5cbi8qIGdsb2JhbHMgJCwgRm9ybUZpbGVVcGxvYWQgKi9cblxuJC5mbi5mb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnM7XG5cbiAgICAgICAgaWYgKCEkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJykpIHtcbiAgICAgICAgICAgIGluc3RhbmNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLCAkKHRoaXMpLmRhdGEoKSk7XG4gICAgICAgICAgICAkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJywgbmV3IEZvcm1GaWxlVXBsb2FkKHRoaXMsIGluc3RhbmNlT3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuIiwiLyogZ2xvYmFscyB3aW5kb3csIGRvY3VtZW50LCBGaWxlUmVhZGVyLCBJbWFnZSAqL1xuXG4vKipcbiAqIFtleHRyYWN0RE9NTm9kZXMgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9iaiBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydHMuZXh0cmFjdERPTU5vZGVzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGlmICh0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBvYmpbMF07XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iajtcbn07XG5cbi8qKlxuICogW3RvQXJyYXkgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9iamVjdCBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydHMudG9BcnJheSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqZWN0LCAwKTtcbn07XG5cbi8qKlxuICogW2hhc0ZpbGVSZWFkZXIgZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydHMuaGFzRmlsZVJlYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5GaWxlUmVhZGVyKTtcbn07XG5cbi8qKlxuICogW25vUHJvcGFnYXRpb24gZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0cy5ub1Byb3BhZ2F0aW9uID0gZnVuY3Rpb24gKGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgaWYgKGUucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgcmV0dXJuIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFttZXJnZU9wdGlvbnMgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9wdHMgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZGVmYXVsdG9wdGlvbnMgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydHMubWVyZ2VPcHRpb25zID0gZnVuY3Rpb24gKG9wdHMsIGRlZmF1bHRPcHRpb25zLCBzZWxmKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7fTtcblxuICAgIGZvciAodmFyIGkgaW4gZGVmYXVsdE9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgb3B0aW9uc1tpXSA9IG9wdHNbaV07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKG9wdGlvbnNbaV0pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1tpXSA9IG9wdGlvbnNbaV0uYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbnNbaV0gPSBkZWZhdWx0T3B0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3B0aW9ucztcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgRmlsZXR5cGVcbiAqIEBwYXJhbSAge1t0eXBlXX0gbmF0aXZlRmlsZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnRzLmdldEZpbGVUeXBlID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBGaXggY2hyb21pdW0gaXNzdWUgMTA1MzgyOiBFeGNlbCAoLnhscykgRmlsZVJlYWRlciBtaW1lIHR5cGUgaXMgZW1wdHkuXG4gICAgaWYgKCgvXFwueGxzJC8pLnRlc3QoZmlsZS5uYW1lKSAmJiAhZmlsZS50eXBlKSB7XG4gICAgICAgIHJldHVybiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJztcbiAgICB9XG4gICAgcmV0dXJuIGZpbGUudHlwZTtcbn07XG5cbi8qKlxuICogVGFrZXMgdGhlIG5hdGl2ZSBmaWxlc2l6ZSBpbiBieXRlcyBhbmQgcmV0dXJucyB0aGUgcHJldHRpZmllZCBmaWxlc2l6ZVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGUgW2NvbnRhaW5zIHRoZSBzaXplIG9mIHRoZSBmaWxlXVxuICogQHJldHVybiB7W3N0cmluZ119ICAgICAgW3ByZXR0aWZpZWQgZmlsZXNpemVdXG4gKi9cbmV4cG9ydHMuZ2V0UmVhZGFibGVGaWxlU2l6ZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHNpemUgPSBmaWxlLnNpemU7XG4gICAgdmFyIHN0cmluZztcblxuICAgIGlmIChzaXplID49IDEwMjQgKiAxMDI0ICogMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ1RCJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQgKiAxMDI0KSB7XG4gICAgICAgIHNpemUgPSBzaXplIC8gKDEwMjQgKiAxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ0dCJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgLyAxMCk7XG4gICAgICAgIHN0cmluZyA9ICdNQic7XG4gICAgfSBlbHNlIGlmIChzaXplID49IDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ0tCJztcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaXplID0gc2l6ZSAqIDEwO1xuICAgICAgICBzdHJpbmcgPSAnQic7XG4gICAgfVxuXG4gICAgcmV0dXJuIChNYXRoLnJvdW5kKHNpemUpIC8gMTApICsgJyAnICsgc3RyaW5nO1xufTtcblxuLyoqXG4gKiBbaXNJbWFnZSBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gIGZpbGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbmV4cG9ydHMuaXNJbWFnZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuICgvXmltYWdlXFwvLykudGVzdChleHBvcnRzLmdldEZpbGVUeXBlKGZpbGUpKTtcbn07XG5cbi8qKlxuICogW2luY3JlbWVudCB0aGUgZmlsZW51bWJlciBmb3IgZWFjaCBkcm9wcGVkIGZpbGUgYnkgb25lICYgaW5jcmVtZW50IHRoZSByZXF1ZXN0c2l6ZSBieSB0aGUgY3VycmVudCBmaWxlc2l6ZV1cbiAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlXG4gKiBAcGFyYW0gIHtbb2JqZWN0XX0gdHJhY2tEYXRhXG4gKi9cbmV4cG9ydHMudHJhY2tGaWxlID0gZnVuY3Rpb24gKGZpbGUsIHRyYWNrRGF0YSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHRyYWNrRGF0YS5maWxlTnVtYmVyICs9IDE7XG4gICAgdHJhY2tEYXRhLnJlcXVlc3RTaXplICs9IGZpbGUuc2l6ZTtcbn07XG5cbi8qKlxuICogW2RlY3JlbWVudCB0aGUgZmlsZW51bWJlciBmb3IgZWFjaCBkZWxldGVkIGZpbGUgYnkgb25lICYgZGVjcmVtZW50IHRoZSByZXF1ZXN0c2l6ZSBieSB0aGUgY3VycmVudCBmaWxlc2l6ZV1cbiAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlXG4gKiBAcGFyYW0gIHtbb2JqZWN0XX0gdHJhY2tEYXRhXG4gKi9cbmV4cG9ydHMudW50cmFja0ZpbGUgPSBmdW5jdGlvbiAoZmlsZSwgdHJhY2tEYXRhKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdHJhY2tEYXRhLmZpbGVOdW1iZXIgLT0gMTtcbiAgICB0cmFja0RhdGEucmVxdWVzdFNpemUgLT0gZmlsZS5zaXplO1xufTtcblxuLyoqXG4gKiBbcmV0dXJucyB0aGUgcHJldHRpZmllZCBmaWxlc3R5cGUgc3RyaW5nIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgb3B0aW9uc11cbiAqIEBwYXJhbSAge1tzdHJpbmddfSBmaWxlVHlwZSBbbWltZXR5cGUgb2YgZmlsZV1cbiAqIEByZXR1cm4ge1tzdHJpbmddfSAgICAgIFtwcmV0dGlmaWVkIHR5cGVzdHJpbmddXG4gKi9cbmV4cG9ydHMuZ2V0UmVhZGFibGVGaWxlVHlwZSA9IGZ1bmN0aW9uIChmaWxlVHlwZSwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiBvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdIHx8ICd1bmtub3duIGZpbGV0eXBlJztcbn07XG5cbmV4cG9ydHMudmFsaWRhdGVGaWxlTnVtYmVyID0gZnVuY3Rpb24gKHRyYWNrRGF0YSwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGlmICh0cmFja0RhdGEuZmlsZU51bWJlciA+PSBvcHRpb25zLm1heEZpbGVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy52YWxpZGF0ZVJlcXVlc3RTaXplID0gZnVuY3Rpb24gKHJlcXVlc3RTaXplLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgaWYgKHJlcXVlc3RTaXplID49IG9wdGlvbnMubWF4UmVxdWVzdFNpemUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy52YWxpZGF0ZUZpbGVUeXBlID0gZnVuY3Rpb24gKGZpbGVUeXBlLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgaWYgKCFvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMudmFsaWRhdGVGaWxlU2l6ZSA9IGZ1bmN0aW9uIChmaWxlLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgaWYgKGZpbGUuc2l6ZSA+IG9wdGlvbnMubWF4RmlsZVNpemUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0cy52YWxpZGF0ZUZpbGVOYW1lID0gZnVuY3Rpb24gKGZpbGUsIG9wdGlvbnMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBpZiAoIShvcHRpb25zLmZpbGVOYW1lUmUpLnRlc3QoZmlsZS5uYW1lKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG4vKipcbiAqIFtkaXNwbGF5cyB0aGUgRXJyb3IgbWVzc2FnZSAmIHJlbW92ZXMgaXQgYWxzbyBhZnRlciB0aGUgc3BlY2lmaWVkIHRpbWVvdXRdXG4gKiBAcGFyYW0gIHtbc3RyaW5nXX0gZXJyb3IgW2Vycm9yIG1lc3NhZ2Ugd2hpY2ggaGFzIHRvIGJlIGRpc3BsYXllZF1cbiAqL1xuZXhwb3J0cy5zaG93RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24gKGVycm9yLCBlcnJvclRpbWVvdXRJZCwgcmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGVycm9yRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICBlcnJvckVsZW1lbnQuY2xhc3NOYW1lID0gJ2Vycm9yJztcbiAgICBlcnJvckVsZW1lbnQuaW5uZXJIVE1MID0gZXJyb3I7XG5cbiAgICBjbGVhclRpbWVvdXQoZXJyb3JUaW1lb3V0SWQpO1xuXG4gICAgZXJyb3JUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmVtb3ZlRXJyb3JzKGVycm9yV3JhcHBlcik7XG4gICAgfSwgb3B0aW9ucy5lcnJvck1lc3NhZ2VUaW1lb3V0KTtcblxuICAgIGVycm9yV3JhcHBlci5hcHBlbmRDaGlsZChlcnJvckVsZW1lbnQpO1xuICAgIGZvcm0uaW5zZXJ0QmVmb3JlKGVycm9yV3JhcHBlciwgZmlsZVZpZXcpO1xufTtcblxuLyoqXG4gKiBbcmVtb3ZlcyBhbGwgZXJyb3JzXVxuICovXG5leHBvcnRzLnJlbW92ZUVycm9ycyA9IGZ1bmN0aW9uIChlcnJvcldyYXBwZXIpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBlcnJvcldyYXBwZXIuaW5uZXJIVE1MID0gJyc7XG59O1xuXG4vKipcbiAqIFtpZiBwb3NzaWJsZSBhZGRzIGEgdGh1bWJuYWlsIG9mIHRoZSBnaXZlbiBmaWxlIHRvIHRoZSBET01dXG4gKiBAcGFyYW0ge1tvYmplY3RdfSAgICAgZmlsZSAgICBbZmlsZWRhdGEgdG8gY3JlYXRlIGEgdGh1bWJuYWlsIHdoaWNoIGdldHMgaW5qZWN0ZWRdXG4gKiBAcGFyYW0ge1tET00gb2JqZWN0XX0gZWxlbWVudCBbRE9NIGVsZW1lbnQgdG8gc3BlY2lmeSB3aGVyZSB0aGUgdGh1bWJuYWlsIGhhcyB0byBiZSBpbmplY3RlZF1cbiAqL1xuZXhwb3J0cy5hZGRUaHVtYm5haWwgPSBmdW5jdGlvbiAoZmlsZSwgZWxlbWVudCwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBFTVBUWV9JTUFHRSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJBUU1BQUFBbDIxYktBQUFBQTFCTVZFVUFBQUNuZWozYUFBQUFBWFJTVGxNQVFPYllaZ0FBQUFwSlJFRlVDTmRqWUFBQUFBSUFBZUlodkRNQUFBQUFTVVZPUks1Q1lJST0nO1xuXG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgdmFyIGZhY3RvciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuICAgIHZhciBpbWdXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXG4gICAgY2FudmFzLndpZHRoICA9IG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3RvcjtcbiAgICBjYW52YXMuaGVpZ2h0ID0gb3B0aW9ucy50aHVtYm5haWxTaXplICogZmFjdG9yO1xuXG4gICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKGZhY3RvciA+IDEpIHtcbiAgICAgICAgY3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gPSBmYWN0b3I7XG4gICAgICAgIGN0eC5zY2FsZShmYWN0b3IsIGZhY3Rvcik7XG4gICAgfVxuXG4gICAgdmFyIGZpbGVOYW1lID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuanNfbmFtZScpO1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltZ1dyYXBwZXIuY2xhc3NOYW1lID0gJ3RodW1ibmFpbCc7XG5cbiAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmF0aW8gPSB0aGlzLmhlaWdodCAvIHRoaXMud2lkdGg7XG5cbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCAqIHJhdGlvO1xuICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMsIDAsIDAsIG9wdGlvbnMudGh1bWJuYWlsU2l6ZSwgb3B0aW9ucy50aHVtYm5haWxTaXplICogcmF0aW8pO1xuICAgIH0pO1xuXG4gICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV4cG9ydHMuaXNJbWFnZShmaWxlKSkge1xuICAgICAgICAgICAgaW1hZ2Uuc3JjID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGltYWdlLnNyYyA9IEVNUFRZX0lNQUdFO1xuICAgICAgICB9XG5cbiAgICAgICAgaW1nV3JhcHBlci5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgICAgICBlbGVtZW50Lmluc2VydEJlZm9yZShpbWdXcmFwcGVyLCBmaWxlTmFtZSk7XG4gICAgfSk7XG5cbiAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbn07XG5cbi8qKlxuICogW0NyZWF0ZXMgYSBsaXN0RWxlbWVudCB3aXRoIHRoZSBkYXRhIG9mIHRoZSBwYXNzZWQgb2JqZWN0XVxuICogQHBhcmFtICB7W3R5cGVdfSBmaWxlT2JqIFt1c2VkIHRvIHB1dCB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIGZpbGUgaW4gdGhlIGxpc3RFbGVtZW10XVxuICogQHJldHVybiB7W29iamVjdF19ICAgICAgIFt0aGUgbGlzdEVsZW1lbnQgd2hpY2ggZ2V0cyBpbmplY3RlZCBpbiB0aGUgRE9NXVxuICovXG5leHBvcnRzLmNyZWF0ZUxpc3RFbGVtZW50ID0gZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlU2l6ZSwgZmlsZVR5cGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZmlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgIGZpbGVFbGVtZW50LmNsYXNzTmFtZSA9ICdmaWxlJztcblxuICAgIGZpbGVFbGVtZW50LmlubmVySFRNTCA9IFtcbiAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBqc19uYW1lIG5hbWVcIj4nLFxuICAgIGZpbGVOYW1lLFxuICAgICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJsYWJlbCBzaXplXCI+JyxcbiAgICBmaWxlU2l6ZSxcbiAgICAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibGFiZWwgdHlwZVwiPicsXG4gICAgZmlsZVR5cGUsXG4gICAgJzwvc3Bhbj4nIF0uam9pbignJyk7XG5cbiAgICByZXR1cm4gZmlsZUVsZW1lbnQ7XG59O1xuXG4vKipcbiAqIFtDcmVhdGVzIGEgbGlzdCBpdGVtIHdoaWNoIGdldHMgaW5qZWN0ZWQgdG8gdGhlIERPTV1cbiAqIEBwYXJhbSB7W29iamVjdF19IGZpbGVPYmogICAgICAgICAgICAgW2ZpbGVkYXRhIGZvciBhZGRpbmcgdGhlIGZpbGVkYXRhICYgcHJldmlldyB0byB0aGUgRE9NXVxuICogQHBhcmFtIHtbZnVuY3Rpb25dfSByZW1vdmVGaWxlSGFuZGxlciBbY2FsbGJhY2sgZm9yIG5vdGlmeWluZyB0aGF0IHRoZSBzcGVjaWZpZWQgZmlsZSB3YXMgZGVsZXRlZF1cbiAqL1xuZXhwb3J0cy5hZGRGaWxlVG9WaWV3ID0gZnVuY3Rpb24gKGZpbGVPYmosIHJlbW92ZUZpbGVIYW5kbGVyQ2FsbGJhY2ssIHRyYWNrRGF0YSwgZmlsZVZpZXcsIGxpc3RFbGVtZW50KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gQWRkIHJlbW92ZSBFbGVtZW50ICYgcmVnaXN0ZXIgcmVtb3ZlIEhhbmRsZXJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHJlbW92ZUJ1dHRvbi5jbGFzc05hbWUgPSAncmVtb3ZlJztcbiAgICBsaXN0RWxlbWVudC5hcHBlbmRDaGlsZChyZW1vdmVCdXR0b24pO1xuXG4gICAgZmlsZVZpZXcuYXBwZW5kQ2hpbGQobGlzdEVsZW1lbnQpO1xuXG4gICAgcmVtb3ZlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjYWxscyB0aGUgY2FsbGJhY2sgb2YgdGhlIERORCBIYW5kbGVyXG4gICAgICAgIHJlbW92ZUZpbGVIYW5kbGVyQ2FsbGJhY2sodHJhY2tEYXRhKTtcblxuICAgICAgICAvLyByZW1vdmUgZmlsZVZpZXdFbGVtZW50XG4gICAgICAgIGxpc3RFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobGlzdEVsZW1lbnQpO1xuXG4gICAgICAgIGV4cG9ydHMudW50cmFja0ZpbGUoZmlsZU9iai5maWxlLCB0cmFja0RhdGEpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBbQ3JlYXRlcyBhIGhpZGRlbiBpbnB1dCBmaWVsZCB3aGVyZSB0aGUgYmFzZTY0IGRhdGEgaXMgc3RvcmVkXVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGVPYmogW3RoZSBiYXNlNjQgc3RyaW5nICYgYWxsIG1ldGFkYXRhIGNvbWJpbmVkIGluIG9uZSBvYmplY3RdXG4gKi9cbmV4cG9ydHMuYWRkQmFzZTY0VG9Eb20gPSBmdW5jdGlvbiAoZmlsZU9iaiwgZm9ybSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICBpbnB1dC50eXBlID0gJ2hpZGRlbic7XG4gICAgaW5wdXQudmFsdWUgPSBmaWxlT2JqLmRhdGE7XG4gICAgaW5wdXQubmFtZSA9ICdmaWxlOicgKyBmaWxlT2JqLmZpbGUubmFtZTtcblxuICAgIGZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dCk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogW2NyZWF0ZUlucHV0RWxlbWVudCBkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnRzLmNyZWF0ZUlucHV0RWxlbWVudCA9IGZ1bmN0aW9uIChmaWxlSW5wdXRJZCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBmaWxlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgZmlsZUlucHV0LnR5cGUgPSAnZmlsZSc7XG4gICAgZmlsZUlucHV0LmNsYXNzTmFtZSA9ICdmaWxlaW5wdXQnO1xuICAgIGZpbGVJbnB1dElkICs9IDE7XG5cbiAgICBmaWxlSW5wdXQubmFtZSA9ICdmaWxlSW5wdXQgJyArIGZpbGVJbnB1dElkO1xuXG4gICAgcmV0dXJuIGZpbGVJbnB1dDtcbn07XG4iXX0=
