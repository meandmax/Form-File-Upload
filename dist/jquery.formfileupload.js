(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* globals document, FileReader */

var mergeOptions        = require('./utils/merge-options.js');
var getFileType         = require('./utils/get-file-type.js');
var getReadableFileSize = require('./utils/get-readable-file-size.js');
var hasFileReader       = require('./utils/has-filereader.js');
var createFileInput     = require('./utils/create-file-input.js');
var noPropagation       = require('./utils/no-propagation.js');
var toArray             = require('./utils/to-array.js');

var formUploadUtils     = require('./formfileuploadutils.js');

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
    var options = mergeOptions(opts, defaultOptions, self);

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
            var removeHandler = formUploadUtils.addBase64ToDom(fileObj, form);
            var fileType = formUploadUtils.getReadableFileType(getFileType(fileObj.file), options);
            var listElement = formUploadUtils.createListElement(fileObj.file.name, getReadableFileSize(fileObj.file), fileType);
            formUploadUtils.addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

            if (hasFileReader()) {
                formUploadUtils.addThumbnail(fileObj.file, listElement, options);
            }
        }
    };

    var validateFile = function (file) {
        if (!formUploadUtils.validateFileNumber(trackData, options)) {
            return options.maxFileNumberError;
        }

        if (!formUploadUtils.validateRequestSize(trackData, options)) {
            return options.maxRequestSizeError;
        }

        if (!formUploadUtils.validateFileType(getFileType(file), options)) {
            return options.invalidFileTypeError;
        }

        if (!formUploadUtils.validateFileSize(file, options)) {
            return options.maxFileSizeError;
        }

        if (!formUploadUtils.validateFileName(file, options)) {
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
                formUploadUtils.showErrorMessage(validateFile(file), errorTimeoutId, formUploadUtils.removeErrors, errorWrapper, form, fileView, options);
                return false;
            }

            formUploadUtils.trackFile(file, trackData);

            reader.addEventListener('load', function (event) {
                convertBase64FileHandler(null, {
                    data: event.target.result,
                    file: file
                });
            });

            reader.addEventListener('error', function () {
                formUploadUtils.convertBase64FileHandler(options.unknownFileReaderError);
            });

            reader.readAsDataURL(file);

            return true;
        });
    };

    /**
     * [Add a fileInput with the selected file to form]
     */
    this.addSelectedFile = function () {
        var fileInput = createFileInput(fileInputId);

        form.insertBefore(selectButton, dropBox);
        selectButton.appendChild(fileInput);

        fileInput.addEventListener('change', function () {
            formUploadUtils.removeErrors(errorWrapper);

            var file = this.files[0];

            var fileObj = {
                file: file
            };

            var removeHandler = function () {
                formUploadUtils.untrackFile(file, trackData);
                fileInput.parentNode.removeChild(fileInput);
            };

            if (typeof validateFile(file) === 'string') {
                formUploadUtils.showErrorMessage(validateFile(file), options.errorTimeoutId, formUploadUtils.removeErrors, errorWrapper, form, fileView, options);
                fileInput.parentNode.removeChild(fileInput);
            } else {
                var fileType = formUploadUtils.getReadableFileType(getFileType(file), options);
                var listElement = formUploadUtils.createListElement(file.name, fileType, getReadableFileSize(fileObj.file));

                formUploadUtils.trackFile(file, trackData);
                formUploadUtils.addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

                if (hasFileReader()) {
                    formUploadUtils.addThumbnail(file, listElement, options);
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
        noPropagation(event);

        var files = toArray(event.dataTransfer.files);

        self.convertFilesToBase64(files);
        this.classList.toggle('active');
    });

    /**
     * The other events are also handled cause they have to be
     * @param {[object]} event [dropEvent where the filelist is binded]
     */
    dropBox.addEventListener('dragenter', function (event) {
        noPropagation(event);
        this.classList.toggle('active');
    });

    /**
     * The other events are also handled cause they have to be
     * @param {[object]} event [dropEvent where the filelist is binded]
     */
    dropBox.addEventListener('dragover', function (event) {
        noPropagation(event);
    });

    /**
     * The other events are also handled cause they have to be
     * @param {[object]} event [dropEvent where the filelist is binded]
     */

    dropBox.addEventListener('dragleave', function (event) {
        noPropagation(event);
        this.classList.toggle('active');
    });

    /**
     * If there is no filereader available, then the dropzone should not be displayed and the Fallback is displayed
     */
    if (!hasFileReader() && options.fallbackForIE8) {
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

},{"./formfileuploadutils.js":2,"./utils/create-file-input.js":3,"./utils/get-file-type.js":4,"./utils/get-readable-file-size.js":5,"./utils/has-filereader.js":6,"./utils/merge-options.js":8,"./utils/no-propagation.js":9,"./utils/to-array.js":10}],2:[function(require,module,exports){
/* globals window, document, FileReader, Image */

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

    var isImage = require('./utils/is-image.js');

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
        ctx.drawImage(this, 0, 0, options.thumbnailSize * factor, options.thumbnailSize * ratio * factor);
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

},{"./utils/is-image.js":7}],3:[function(require,module,exports){
/**
 * [createInputElement description]
 * @return {[type]} [description]
 */
var createFileInput = function (fileInputId) {
    'use strict';

    var fileInput = document.createElement('input');

    fileInput.type = 'file';
    fileInput.className = 'fileinput';
    fileInputId += 1;

    fileInput.name = 'fileInput ' + fileInputId;

    return fileInput;
};

module.exports = createFileInput;

},{}],4:[function(require,module,exports){
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

module.exports = getFileType;

},{}],5:[function(require,module,exports){
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

module.exports = getReadableFileSize;

},{}],6:[function(require,module,exports){
/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function () {
    'use strict';

    return !!(window.File && window.FileList && window.FileReader);
};

module.exports = hasFileReader;

},{}],7:[function(require,module,exports){
var getFileType = require('./get-file-type.js')

/**
 * [isImage description]
 * @param  {[type]}  file [description]
 * @return {Boolean}      [description]
 */
var isImage = function (file) {
    'use strict';

    return (/^image\//).test(getFileType(file));
};

module.exports = isImage;

},{"./get-file-type.js":4}],8:[function(require,module,exports){
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

module.exports = mergeOptions;

},{}],9:[function(require,module,exports){
/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
var noPropagation = function (event) {
    'use strict';

    event.stopPropagation();

    if (event.preventDefault) {
        return event.preventDefault();
    } else {
        event.returnValue = false;
        return false;
    }
};

module.exports = noPropagation;

},{}],10:[function(require,module,exports){
/**
 * [toArray description]
 * @param  {[type]} object [description]
 * @return {[type]}        [description]
 */
var toArray = function (object) {
    'use strict';

    return Array.prototype.slice.call(object, 0);
};

module.exports = toArray;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvZmFrZV9lNDQ5ZmMzOC5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL2Zvcm1maWxldXBsb2FkdXRpbHMuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9jcmVhdGUtZmlsZS1pbnB1dC5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2dldC1maWxlLXR5cGUuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9nZXQtcmVhZGFibGUtZmlsZS1zaXplLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvaGFzLWZpbGVyZWFkZXIuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9pcy1pbWFnZS5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL21lcmdlLW9wdGlvbnMuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9uby1wcm9wYWdhdGlvbi5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL3RvLWFycmF5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9PQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWxzIGRvY3VtZW50LCBGaWxlUmVhZGVyICovXG5cbnZhciBtZXJnZU9wdGlvbnMgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9tZXJnZS1vcHRpb25zLmpzJyk7XG52YXIgZ2V0RmlsZVR5cGUgICAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0LWZpbGUtdHlwZS5qcycpO1xudmFyIGdldFJlYWRhYmxlRmlsZVNpemUgPSByZXF1aXJlKCcuL3V0aWxzL2dldC1yZWFkYWJsZS1maWxlLXNpemUuanMnKTtcbnZhciBoYXNGaWxlUmVhZGVyICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9oYXMtZmlsZXJlYWRlci5qcycpO1xudmFyIGNyZWF0ZUZpbGVJbnB1dCAgICAgPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZS1maWxlLWlucHV0LmpzJyk7XG52YXIgbm9Qcm9wYWdhdGlvbiAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvbm8tcHJvcGFnYXRpb24uanMnKTtcbnZhciB0b0FycmF5ICAgICAgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy90by1hcnJheS5qcycpO1xuXG52YXIgZm9ybVVwbG9hZFV0aWxzICAgICA9IHJlcXVpcmUoJy4vZm9ybWZpbGV1cGxvYWR1dGlscy5qcycpO1xuXG52YXIgRm9ybUZpbGVVcGxvYWQgPSBmdW5jdGlvbiAoZmlsZVVwbG9hZF8sIG9wdHMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZXJyb3JUaW1lb3V0SWQ7XG4gICAgdmFyIGZpbGVJbnB1dElkID0gMDtcblxuICAgIHZhciB0cmFja0RhdGEgPSB7XG4gICAgICAgIGZpbGVOdW1iZXI6IDAsXG4gICAgICAgIHJlcXVlc3RTaXplOiAwXG4gICAgfTtcblxuICAgIHZhciBzZWxmICAgICAgICAgPSB0aGlzO1xuICAgIHZhciBkcm9wQm94ICAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZHJvcGJveCcpO1xuICAgIHZhciBmaWxlVmlldyAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfbGlzdCcpO1xuICAgIHZhciBmaWxlSW5wdXRzICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZmlsZWlucHV0cycpO1xuICAgIHZhciBmb3JtICAgICAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZm9ybScpO1xuICAgIHZhciBlcnJvcldyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgc2VsZWN0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFt0aW1lb3V0IHNwZWNpZmllcyBob3cgbG9uZyB0aGUgZXJyb3IgbWVzc2FnZXMgYXJlIGRpc3BsYXllZF1cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yTWVzc2FnZVRpbWVvdXQ6IDUwMDAsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFt0aGUgbWF4aW11bSBmaWxlc2l6ZSBvZiBlYWNoIGZpbGUgaW4gYnl0ZXNdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlU2l6ZTogMzE0NTcyOCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW21heEZpbGVOdW1iZXIgZGVmaW5lcyBob3cgbWFueSBmaWxlcyBhcmUgYWxsb3dlZCB0byB1cGxvYWQgd2l0aCBlYWNoIHJlcXVlc3RdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlTnVtYmVyOiAzLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbU2l6ZSBvZiB0aHVtYm5haWxzIGRpc3BsYXllZCBpbiB0aGUgYnJvd3NlciBmb3IgcHJldmlldyB0aGUgaW1hZ2VzXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGh1bWJuYWlsU2l6ZTogMTAwLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZGVmaW5lcyB0aGUgbWF4aW11bSBzaXplIG9mIGVhY2ggcmVxdWVzdCBpbiBieXRlc11cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heFJlcXVlc3RTaXplOiA5NDM3MTg0LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbSWYgdHJ1ZSB0aGUgZmFsbGJhY2sgZm9yIElFOCBpcyBhY3RpdmF0ZWRdXG4gICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZmFsbGJhY2tGb3JJRTg6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtSZWd1bGFyIEV4cHJlc3Npb24gZm9yIGZpbGVuYW1lIG1hdGNoaW5nXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZmlsZU5hbWVSZTogL15bQS1aYS16MC05LlxcLV8gXSskLyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgZmlsZSBoYXMgY2hhcmFjdGVycyB3aGljaCBhcmUgbm90IGFsbG93ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpbnZhbGlkRmlsZU5hbWVFcnJvcjogJ1RoZSBuYW1lIG9mIHRoZSBmaWxlIGhhcyBmb3JiaWRkZW4gY2hhcmFjdGVycycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIGZpbGV0eXBlIGlzIG5vdCBhbGxvd2VkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaW52YWxpZEZpbGVUeXBlRXJyb3I6ICdUaGUgZmlsZWZvcm1hdCBpcyBub3QgYWxsb3dlZCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gcmVxdWVzdHNpemUgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heFJlcXVlc3RTaXplRXJyb3I6ICdUaGUgcmVxdWVzdHNpemUgb2YgdGhlIGZpbGVzIHlvdSB3YW50IHRvIHVwbG9hZCBpcyBleGNlZWRlZC4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBtYXguIGZpbGVudW1iZXIgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVOdW1iZXJFcnJvcjogJ1lvdSBjYW4gdXBsb2FkIDMgZmlsZXMsIG5vdCBtb3JlIScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gZmlsZW5zaXplIGlzIHJlYWNoZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlU2l6ZUVycm9yOiAnT25lIG9mIHRoZSBmaWxlcyBpcyB0b28gbGFyZ2UuIHRoZSBtYXhpbXVtIGZpbGVzaXplIGlzIDMgTUIuJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW0lmIHNvbWV0aGluZyBkdXJpbmcgdGhlIGZpbGVyZWFkaW5nIHByb2Nlc3Mgd2VudCB3cm9uZywgdGhlbiB0aGlzIG1lc3NhZ2UgaXMgZGlzcGxheWVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdW5rbm93bkZpbGVSZWFkZXJFcnJvcjogJ1Vua25vd24gRXJyb3Igd2hpbGUgbG9hZGluZyB0aGUgZmlsZS4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbT2JqZWN0cyBjb250YWlucyBhbGwgYWxsb3dlZCBtaW1ldHlwZXMgYXMga2V5cyAmIHRoZSBwcmV0dGlmaWVkIGZpbGVuYW1lcyBhcyB2YWx1ZXNdXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NlcHRlZFR5cGVzOiB7XG4gICAgICAgICAgICAnaW1hZ2UvcG5nJzogJ1BORy1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS9qcGVnJzogJ0pQRUctQmlsZCcsXG4gICAgICAgICAgICAnaW1hZ2UvZ2lmJzogJ0dJRi1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS90aWZmJzogJ1RJRkYtQmlsZCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vcGRmJzogJ1BERi1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJzogJ0V4Y2VsLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCc6ICdFeGNlbC1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vbXN3b3JkJzogJ1dvcmQtRG9rdW1lbnQnLFxuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JzogJ1dvcmQtRG9rdW1lbnQnXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWVyZ2luZyB0aGUgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIHVzZXIgcGFzc2VkIG9wdGlvbnMgdG9nZXRoZXJcbiAgICAgKiBAdHlwZSB7W29iamVjdF19XG4gICAgICovXG4gICAgdmFyIG9wdGlvbnMgPSBtZXJnZU9wdGlvbnMob3B0cywgZGVmYXVsdE9wdGlvbnMsIHNlbGYpO1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgdGhlIGFzeW5jIGZpbGVyZWFkZXIgcmVzcG9uc2VcbiAgICAgKiBAcGFyYW0gIHtbc3RyaW5nXX0gZXJyICAgICBbdGhlIGVycm9ybWVzc2FnZSB3aGljaCBnZXRzIHRocm93biB3aGVuIHRoZSBmaWxlcmVhZGVyIGVycm9yZWRdXG4gICAgICogQHBhcmFtICB7W29iamVjdF19IGZpbGVPYmogW3RoZSBiYXNlNjQgc3RyaW5nICYgYWxsIG1ldGFkYXRhIGNvbWJpbmVkIGluIG9uZSBvYmplY3RdXG4gICAgICovXG4gICAgdmFyIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlciA9IGZ1bmN0aW9uIChlcnIsIGZpbGVPYmopIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWxlT2JqKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlSGFuZGxlciA9IGZvcm1VcGxvYWRVdGlscy5hZGRCYXNlNjRUb0RvbShmaWxlT2JqLCBmb3JtKTtcbiAgICAgICAgICAgIHZhciBmaWxlVHlwZSA9IGZvcm1VcGxvYWRVdGlscy5nZXRSZWFkYWJsZUZpbGVUeXBlKGdldEZpbGVUeXBlKGZpbGVPYmouZmlsZSksIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIGxpc3RFbGVtZW50ID0gZm9ybVVwbG9hZFV0aWxzLmNyZWF0ZUxpc3RFbGVtZW50KGZpbGVPYmouZmlsZS5uYW1lLCBnZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSksIGZpbGVUeXBlKTtcbiAgICAgICAgICAgIGZvcm1VcGxvYWRVdGlscy5hZGRGaWxlVG9WaWV3KGZpbGVPYmosIHJlbW92ZUhhbmRsZXIsIHRyYWNrRGF0YSwgZmlsZVZpZXcsIGxpc3RFbGVtZW50KTtcblxuICAgICAgICAgICAgaWYgKGhhc0ZpbGVSZWFkZXIoKSkge1xuICAgICAgICAgICAgICAgIGZvcm1VcGxvYWRVdGlscy5hZGRUaHVtYm5haWwoZmlsZU9iai5maWxlLCBsaXN0RWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIGlmICghZm9ybVVwbG9hZFV0aWxzLnZhbGlkYXRlRmlsZU51bWJlcih0cmFja0RhdGEsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlTnVtYmVyRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZvcm1VcGxvYWRVdGlscy52YWxpZGF0ZVJlcXVlc3RTaXplKHRyYWNrRGF0YSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLm1heFJlcXVlc3RTaXplRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZvcm1VcGxvYWRVdGlscy52YWxpZGF0ZUZpbGVUeXBlKGdldEZpbGVUeXBlKGZpbGUpLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW52YWxpZEZpbGVUeXBlRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZvcm1VcGxvYWRVdGlscy52YWxpZGF0ZUZpbGVTaXplKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlU2l6ZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFmb3JtVXBsb2FkVXRpbHMudmFsaWRhdGVGaWxlTmFtZShmaWxlLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW52YWxpZEZpbGVOYW1lRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2NvbnZlcnRzIHRoZSBmaWxlZGF0YSBpbnRvIGEgYmFzZTY0IHN0cmluZyBhbmQgdmFsaWRhdGVzIHRoZSBmaWxlZGF0YV1cbiAgICAgKiBAcGFyYW0gIHtbYXJyYXldfSAgZmlsZXMgIFt0aGUgY29udmVydGVkIGZpbGVMaXN0T2JqZWN0XVxuICAgICAqL1xuICAgIHRoaXMuY29udmVydEZpbGVzVG9CYXNlNjQgPSBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgZmlsZXMuZXZlcnkoZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbGlkYXRlRmlsZShmaWxlKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBmb3JtVXBsb2FkVXRpbHMuc2hvd0Vycm9yTWVzc2FnZSh2YWxpZGF0ZUZpbGUoZmlsZSksIGVycm9yVGltZW91dElkLCBmb3JtVXBsb2FkVXRpbHMucmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvcm1VcGxvYWRVdGlscy50cmFja0ZpbGUoZmlsZSwgdHJhY2tEYXRhKTtcblxuICAgICAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjb252ZXJ0QmFzZTY0RmlsZUhhbmRsZXIobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiBldmVudC50YXJnZXQucmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGZvcm1VcGxvYWRVdGlscy5jb252ZXJ0QmFzZTY0RmlsZUhhbmRsZXIob3B0aW9ucy51bmtub3duRmlsZVJlYWRlckVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbQWRkIGEgZmlsZUlucHV0IHdpdGggdGhlIHNlbGVjdGVkIGZpbGUgdG8gZm9ybV1cbiAgICAgKi9cbiAgICB0aGlzLmFkZFNlbGVjdGVkRmlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZpbGVJbnB1dCA9IGNyZWF0ZUZpbGVJbnB1dChmaWxlSW5wdXRJZCk7XG5cbiAgICAgICAgZm9ybS5pbnNlcnRCZWZvcmUoc2VsZWN0QnV0dG9uLCBkcm9wQm94KTtcbiAgICAgICAgc2VsZWN0QnV0dG9uLmFwcGVuZENoaWxkKGZpbGVJbnB1dCk7XG5cbiAgICAgICAgZmlsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvcm1VcGxvYWRVdGlscy5yZW1vdmVFcnJvcnMoZXJyb3JXcmFwcGVyKTtcblxuICAgICAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmZpbGVzWzBdO1xuXG4gICAgICAgICAgICB2YXIgZmlsZU9iaiA9IHtcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBmb3JtVXBsb2FkVXRpbHMudW50cmFja0ZpbGUoZmlsZSwgdHJhY2tEYXRhKTtcbiAgICAgICAgICAgICAgICBmaWxlSW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWxpZGF0ZUZpbGUoZmlsZSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZm9ybVVwbG9hZFV0aWxzLnNob3dFcnJvck1lc3NhZ2UodmFsaWRhdGVGaWxlKGZpbGUpLCBvcHRpb25zLmVycm9yVGltZW91dElkLCBmb3JtVXBsb2FkVXRpbHMucmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBmaWxlSW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSBmb3JtVXBsb2FkVXRpbHMuZ2V0UmVhZGFibGVGaWxlVHlwZShnZXRGaWxlVHlwZShmaWxlKSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3RFbGVtZW50ID0gZm9ybVVwbG9hZFV0aWxzLmNyZWF0ZUxpc3RFbGVtZW50KGZpbGUubmFtZSwgZmlsZVR5cGUsIGdldFJlYWRhYmxlRmlsZVNpemUoZmlsZU9iai5maWxlKSk7XG5cbiAgICAgICAgICAgICAgICBmb3JtVXBsb2FkVXRpbHMudHJhY2tGaWxlKGZpbGUsIHRyYWNrRGF0YSk7XG4gICAgICAgICAgICAgICAgZm9ybVVwbG9hZFV0aWxzLmFkZEZpbGVUb1ZpZXcoZmlsZU9iaiwgcmVtb3ZlSGFuZGxlciwgdHJhY2tEYXRhLCBmaWxlVmlldywgbGlzdEVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0ZpbGVSZWFkZXIoKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3JtVXBsb2FkVXRpbHMuYWRkVGh1bWJuYWlsKGZpbGUsIGxpc3RFbGVtZW50LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmaWxlSW5wdXRzLmFwcGVuZENoaWxkKGZpbGVJbnB1dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGYuYWRkU2VsZWN0ZWRGaWxlKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBkcm9waGFuZGxlciBjYWxscyB0aGUgZG5kSGFuZGxlciBhbHdheXMgd2hlbm4gYSBmaWxlIGdldHMgZHJvcHBlZFxuICAgICAqIEBwYXJhbSB7W29iamVjdF19IGV2ZW50IFtkcm9wRXZlbnQgd2hlcmUgdGhlIGZpbGVsaXN0IGlzIGJpbmRlZF1cbiAgICAgKi9cbiAgICBkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG5cbiAgICAgICAgdmFyIGZpbGVzID0gdG9BcnJheShldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuXG4gICAgICAgIHNlbGYuY29udmVydEZpbGVzVG9CYXNlNjQoZmlsZXMpO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG90aGVyIGV2ZW50cyBhcmUgYWxzbyBoYW5kbGVkIGNhdXNlIHRoZXkgaGF2ZSB0byBiZVxuICAgICAqIEBwYXJhbSB7W29iamVjdF19IGV2ZW50IFtkcm9wRXZlbnQgd2hlcmUgdGhlIGZpbGVsaXN0IGlzIGJpbmRlZF1cbiAgICAgKi9cbiAgICBkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG5cbiAgICBkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIElmIHRoZXJlIGlzIG5vIGZpbGVyZWFkZXIgYXZhaWxhYmxlLCB0aGVuIHRoZSBkcm9wem9uZSBzaG91bGQgbm90IGJlIGRpc3BsYXllZCBhbmQgdGhlIEZhbGxiYWNrIGlzIGRpc3BsYXllZFxuICAgICAqL1xuICAgIGlmICghaGFzRmlsZVJlYWRlcigpICYmIG9wdGlvbnMuZmFsbGJhY2tGb3JJRTgpIHtcbiAgICAgICAgc2VsZWN0QnV0dG9uLmNsYXNzTmFtZSA9ICdzZWxlY3RidXR0b24ganNfc2VsZWN0YnV0dG9uJztcblxuICAgICAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICBzcGFuLmlubmVySFRNTCA9ICdTZWxlY3QgRmlsZSc7XG5cbiAgICAgICAgc2VsZWN0QnV0dG9uLmFwcGVuZENoaWxkKHNwYW4pO1xuXG4gICAgICAgIHNlbGYuYWRkU2VsZWN0ZWRGaWxlKCk7XG5cbiAgICAgICAgZHJvcEJveC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRm9ybUZpbGVVcGxvYWQ7XG5cbi8qIGdsb2JhbHMgJCwgRm9ybUZpbGVVcGxvYWQgKi9cblxuJC5mbi5mb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnM7XG5cbiAgICAgICAgaWYgKCEkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJykpIHtcbiAgICAgICAgICAgIGluc3RhbmNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLCAkKHRoaXMpLmRhdGEoKSk7XG4gICAgICAgICAgICAkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJywgbmV3IEZvcm1GaWxlVXBsb2FkKHRoaXMsIGluc3RhbmNlT3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuIiwiLyogZ2xvYmFscyB3aW5kb3csIGRvY3VtZW50LCBGaWxlUmVhZGVyLCBJbWFnZSAqL1xuXG4vKipcbiAqIFtpbmNyZW1lbnQgdGhlIGZpbGVudW1iZXIgZm9yIGVhY2ggZHJvcHBlZCBmaWxlIGJ5IG9uZSAmIGluY3JlbWVudCB0aGUgcmVxdWVzdHNpemUgYnkgdGhlIGN1cnJlbnQgZmlsZXNpemVdXG4gKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZVxuICogQHBhcmFtICB7W29iamVjdF19IHRyYWNrRGF0YVxuICovXG5leHBvcnRzLnRyYWNrRmlsZSA9IGZ1bmN0aW9uIChmaWxlLCB0cmFja0RhdGEpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB0cmFja0RhdGEuZmlsZU51bWJlciArPSAxO1xuICAgIHRyYWNrRGF0YS5yZXF1ZXN0U2l6ZSArPSBmaWxlLnNpemU7XG59O1xuXG4vKipcbiAqIFtkZWNyZW1lbnQgdGhlIGZpbGVudW1iZXIgZm9yIGVhY2ggZGVsZXRlZCBmaWxlIGJ5IG9uZSAmIGRlY3JlbWVudCB0aGUgcmVxdWVzdHNpemUgYnkgdGhlIGN1cnJlbnQgZmlsZXNpemVdXG4gKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZVxuICogQHBhcmFtICB7W29iamVjdF19IHRyYWNrRGF0YVxuICovXG5leHBvcnRzLnVudHJhY2tGaWxlID0gZnVuY3Rpb24gKGZpbGUsIHRyYWNrRGF0YSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHRyYWNrRGF0YS5maWxlTnVtYmVyIC09IDE7XG4gICAgdHJhY2tEYXRhLnJlcXVlc3RTaXplIC09IGZpbGUuc2l6ZTtcbn07XG5cbi8qKlxuICogW3JldHVybnMgdGhlIHByZXR0aWZpZWQgZmlsZXN0eXBlIHN0cmluZyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIG9wdGlvbnNdXG4gKiBAcGFyYW0gIHtbc3RyaW5nXX0gZmlsZVR5cGUgW21pbWV0eXBlIG9mIGZpbGVdXG4gKiBAcmV0dXJuIHtbc3RyaW5nXX0gICAgICBbcHJldHRpZmllZCB0eXBlc3RyaW5nXVxuICovXG5leHBvcnRzLmdldFJlYWRhYmxlRmlsZVR5cGUgPSBmdW5jdGlvbiAoZmlsZVR5cGUsIG9wdGlvbnMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gb3B0aW9ucy5hY2NlcHRlZFR5cGVzW2ZpbGVUeXBlXSB8fCAndW5rbm93biBmaWxldHlwZSc7XG59O1xuXG5leHBvcnRzLnZhbGlkYXRlRmlsZU51bWJlciA9IGZ1bmN0aW9uICh0cmFja0RhdGEsIG9wdGlvbnMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICBpZiAodHJhY2tEYXRhLmZpbGVOdW1iZXIgPj0gb3B0aW9ucy5tYXhGaWxlTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMudmFsaWRhdGVSZXF1ZXN0U2l6ZSA9IGZ1bmN0aW9uIChyZXF1ZXN0U2l6ZSwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGlmIChyZXF1ZXN0U2l6ZSA+PSBvcHRpb25zLm1heFJlcXVlc3RTaXplKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMudmFsaWRhdGVGaWxlVHlwZSA9IGZ1bmN0aW9uIChmaWxlVHlwZSwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGlmICghb3B0aW9ucy5hY2NlcHRlZFR5cGVzW2ZpbGVUeXBlXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG59O1xuXG5leHBvcnRzLnZhbGlkYXRlRmlsZVNpemUgPSBmdW5jdGlvbiAoZmlsZSwgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGlmIChmaWxlLnNpemUgPiBvcHRpb25zLm1heEZpbGVTaXplKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbn07XG5cbmV4cG9ydHMudmFsaWRhdGVGaWxlTmFtZSA9IGZ1bmN0aW9uIChmaWxlLCBvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgaWYgKCEob3B0aW9ucy5maWxlTmFtZVJlKS50ZXN0KGZpbGUubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBbZGlzcGxheXMgdGhlIEVycm9yIG1lc3NhZ2UgJiByZW1vdmVzIGl0IGFsc28gYWZ0ZXIgdGhlIHNwZWNpZmllZCB0aW1lb3V0XVxuICogQHBhcmFtICB7W3N0cmluZ119IGVycm9yIFtlcnJvciBtZXNzYWdlIHdoaWNoIGhhcyB0byBiZSBkaXNwbGF5ZWRdXG4gKi9cbmV4cG9ydHMuc2hvd0Vycm9yTWVzc2FnZSA9IGZ1bmN0aW9uIChlcnJvciwgZXJyb3JUaW1lb3V0SWQsIHJlbW92ZUVycm9ycywgZXJyb3JXcmFwcGVyLCBmb3JtLCBmaWxlVmlldywgb3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBlcnJvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgZXJyb3JFbGVtZW50LmNsYXNzTmFtZSA9ICdlcnJvcic7XG4gICAgZXJyb3JFbGVtZW50LmlubmVySFRNTCA9IGVycm9yO1xuXG4gICAgY2xlYXJUaW1lb3V0KGVycm9yVGltZW91dElkKTtcblxuICAgIGVycm9yVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJlbW92ZUVycm9ycyhlcnJvcldyYXBwZXIpO1xuICAgIH0sIG9wdGlvbnMuZXJyb3JNZXNzYWdlVGltZW91dCk7XG5cbiAgICBlcnJvcldyYXBwZXIuYXBwZW5kQ2hpbGQoZXJyb3JFbGVtZW50KTtcbiAgICBmb3JtLmluc2VydEJlZm9yZShlcnJvcldyYXBwZXIsIGZpbGVWaWV3KTtcbn07XG5cbi8qKlxuICogW3JlbW92ZXMgYWxsIGVycm9yc11cbiAqL1xuZXhwb3J0cy5yZW1vdmVFcnJvcnMgPSBmdW5jdGlvbiAoZXJyb3JXcmFwcGVyKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZXJyb3JXcmFwcGVyLmlubmVySFRNTCA9ICcnO1xufTtcblxuLyoqXG4gKiBbaWYgcG9zc2libGUgYWRkcyBhIHRodW1ibmFpbCBvZiB0aGUgZ2l2ZW4gZmlsZSB0byB0aGUgRE9NXVxuICogQHBhcmFtIHtbb2JqZWN0XX0gICAgIGZpbGUgICAgW2ZpbGVkYXRhIHRvIGNyZWF0ZSBhIHRodW1ibmFpbCB3aGljaCBnZXRzIGluamVjdGVkXVxuICogQHBhcmFtIHtbRE9NIG9iamVjdF19IGVsZW1lbnQgW0RPTSBlbGVtZW50IHRvIHNwZWNpZnkgd2hlcmUgdGhlIHRodW1ibmFpbCBoYXMgdG8gYmUgaW5qZWN0ZWRdXG4gKi9cbmV4cG9ydHMuYWRkVGh1bWJuYWlsID0gZnVuY3Rpb24gKGZpbGUsIGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgaXNJbWFnZSA9IHJlcXVpcmUoJy4vdXRpbHMvaXMtaW1hZ2UuanMnKTtcblxuICAgIHZhciBFTVBUWV9JTUFHRSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJBUU1BQUFBbDIxYktBQUFBQTFCTVZFVUFBQUNuZWozYUFBQUFBWFJTVGxNQVFPYllaZ0FBQUFwSlJFRlVDTmRqWUFBQUFBSUFBZUlodkRNQUFBQUFTVVZPUks1Q1lJST0nO1xuXG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgdmFyIGZhY3RvciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuICAgIHZhciBpbWdXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXG4gICAgY2FudmFzLndpZHRoICA9IG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3RvcjtcbiAgICBjYW52YXMuaGVpZ2h0ID0gb3B0aW9ucy50aHVtYm5haWxTaXplICogZmFjdG9yO1xuXG4gICAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKGZhY3RvciA+IDEpIHtcbiAgICAgICAgY3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gPSBmYWN0b3I7XG4gICAgICAgIGN0eC5zY2FsZShmYWN0b3IsIGZhY3Rvcik7XG4gICAgfVxuXG4gICAgdmFyIGZpbGVOYW1lID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuanNfbmFtZScpO1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltZ1dyYXBwZXIuY2xhc3NOYW1lID0gJ3RodW1ibmFpbCc7XG5cbiAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcmF0aW8gPSB0aGlzLmhlaWdodCAvIHRoaXMud2lkdGg7XG5cbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCAqIHJhdGlvO1xuICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMsIDAsIDAsIG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3Rvciwgb3B0aW9ucy50aHVtYm5haWxTaXplICogcmF0aW8gKiBmYWN0b3IpO1xuICAgIH0pO1xuXG4gICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGlzSW1hZ2UoZmlsZSkpIHtcbiAgICAgICAgICAgIGltYWdlLnNyYyA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbWFnZS5zcmMgPSBFTVBUWV9JTUFHRTtcbiAgICAgICAgfVxuXG4gICAgICAgIGltZ1dyYXBwZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcbiAgICAgICAgZWxlbWVudC5pbnNlcnRCZWZvcmUoaW1nV3JhcHBlciwgZmlsZU5hbWUpO1xuICAgIH0pO1xuXG4gICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG59O1xuXG4vKipcbiAqIFtDcmVhdGVzIGEgbGlzdEVsZW1lbnQgd2l0aCB0aGUgZGF0YSBvZiB0aGUgcGFzc2VkIG9iamVjdF1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZmlsZU9iaiBbdXNlZCB0byBwdXQgdGhlIGluZm9ybWF0aW9uIG9mIHRoZSBmaWxlIGluIHRoZSBsaXN0RWxlbWVtdF1cbiAqIEByZXR1cm4ge1tvYmplY3RdfSAgICAgICBbdGhlIGxpc3RFbGVtZW50IHdoaWNoIGdldHMgaW5qZWN0ZWQgaW4gdGhlIERPTV1cbiAqL1xuZXhwb3J0cy5jcmVhdGVMaXN0RWxlbWVudCA9IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVNpemUsIGZpbGVUeXBlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGZpbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBmaWxlRWxlbWVudC5jbGFzc05hbWUgPSAnZmlsZSc7XG5cbiAgICBmaWxlRWxlbWVudC5pbm5lckhUTUwgPSBbXG4gICAgJzxzcGFuIGNsYXNzPVwibGFiZWwganNfbmFtZSBuYW1lXCI+JyxcbiAgICBmaWxlTmFtZSxcbiAgICAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibGFiZWwgc2l6ZVwiPicsXG4gICAgZmlsZVNpemUsXG4gICAgJzwvc3Bhbj48c3BhbiBjbGFzcz1cImxhYmVsIHR5cGVcIj4nLFxuICAgIGZpbGVUeXBlLFxuICAgICc8L3NwYW4+JyBdLmpvaW4oJycpO1xuXG4gICAgcmV0dXJuIGZpbGVFbGVtZW50O1xufTtcblxuLyoqXG4gKiBbQ3JlYXRlcyBhIGxpc3QgaXRlbSB3aGljaCBnZXRzIGluamVjdGVkIHRvIHRoZSBET01dXG4gKiBAcGFyYW0ge1tvYmplY3RdfSBmaWxlT2JqICAgICAgICAgICAgIFtmaWxlZGF0YSBmb3IgYWRkaW5nIHRoZSBmaWxlZGF0YSAmIHByZXZpZXcgdG8gdGhlIERPTV1cbiAqIEBwYXJhbSB7W2Z1bmN0aW9uXX0gcmVtb3ZlRmlsZUhhbmRsZXIgW2NhbGxiYWNrIGZvciBub3RpZnlpbmcgdGhhdCB0aGUgc3BlY2lmaWVkIGZpbGUgd2FzIGRlbGV0ZWRdXG4gKi9cbmV4cG9ydHMuYWRkRmlsZVRvVmlldyA9IGZ1bmN0aW9uIChmaWxlT2JqLCByZW1vdmVGaWxlSGFuZGxlckNhbGxiYWNrLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEFkZCByZW1vdmUgRWxlbWVudCAmIHJlZ2lzdGVyIHJlbW92ZSBIYW5kbGVyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcbiAgICByZW1vdmVCdXR0b24uY2xhc3NOYW1lID0gJ3JlbW92ZSc7XG4gICAgbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQocmVtb3ZlQnV0dG9uKTtcblxuICAgIGZpbGVWaWV3LmFwcGVuZENoaWxkKGxpc3RFbGVtZW50KTtcblxuICAgIHJlbW92ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY2FsbHMgdGhlIGNhbGxiYWNrIG9mIHRoZSBETkQgSGFuZGxlclxuICAgICAgICByZW1vdmVGaWxlSGFuZGxlckNhbGxiYWNrKHRyYWNrRGF0YSk7XG5cbiAgICAgICAgLy8gcmVtb3ZlIGZpbGVWaWV3RWxlbWVudFxuICAgICAgICBsaXN0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpc3RFbGVtZW50KTtcblxuICAgICAgICBleHBvcnRzLnVudHJhY2tGaWxlKGZpbGVPYmouZmlsZSwgdHJhY2tEYXRhKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogW0NyZWF0ZXMgYSBoaWRkZW4gaW5wdXQgZmllbGQgd2hlcmUgdGhlIGJhc2U2NCBkYXRhIGlzIHN0b3JlZF1cbiAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlT2JqIFt0aGUgYmFzZTY0IHN0cmluZyAmIGFsbCBtZXRhZGF0YSBjb21iaW5lZCBpbiBvbmUgb2JqZWN0XVxuICovXG5leHBvcnRzLmFkZEJhc2U2NFRvRG9tID0gZnVuY3Rpb24gKGZpbGVPYmosIGZvcm0pIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgaW5wdXQudHlwZSA9ICdoaWRkZW4nO1xuICAgIGlucHV0LnZhbHVlID0gZmlsZU9iai5kYXRhO1xuICAgIGlucHV0Lm5hbWUgPSAnZmlsZTonICsgZmlsZU9iai5maWxlLm5hbWU7XG5cbiAgICBmb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlucHV0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaW5wdXQpO1xuICAgIH07XG59O1xuIiwiLyoqXG4gKiBbY3JlYXRlSW5wdXRFbGVtZW50IGRlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBjcmVhdGVGaWxlSW5wdXQgPSBmdW5jdGlvbiAoZmlsZUlucHV0SWQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZmlsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblxuICAgIGZpbGVJbnB1dC50eXBlID0gJ2ZpbGUnO1xuICAgIGZpbGVJbnB1dC5jbGFzc05hbWUgPSAnZmlsZWlucHV0JztcbiAgICBmaWxlSW5wdXRJZCArPSAxO1xuXG4gICAgZmlsZUlucHV0Lm5hbWUgPSAnZmlsZUlucHV0ICcgKyBmaWxlSW5wdXRJZDtcblxuICAgIHJldHVybiBmaWxlSW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUZpbGVJbnB1dDtcbiIsIi8qKlxuICogUmV0dXJucyB0aGUgRmlsZXR5cGVcbiAqIEBwYXJhbSAge1t0eXBlXX0gbmF0aXZlRmlsZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgZ2V0RmlsZVR5cGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEZpeCBjaHJvbWl1bSBpc3N1ZSAxMDUzODI6IEV4Y2VsICgueGxzKSBGaWxlUmVhZGVyIG1pbWUgdHlwZSBpcyBlbXB0eS5cbiAgICBpZiAoKC9cXC54bHMkLykudGVzdChmaWxlLm5hbWUpICYmICFmaWxlLnR5cGUpIHtcbiAgICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZS50eXBlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRGaWxlVHlwZTtcbiIsIi8qKlxuICogVGFrZXMgdGhlIG5hdGl2ZSBmaWxlc2l6ZSBpbiBieXRlcyBhbmQgcmV0dXJucyB0aGUgcHJldHRpZmllZCBmaWxlc2l6ZVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGUgW2NvbnRhaW5zIHRoZSBzaXplIG9mIHRoZSBmaWxlXVxuICogQHJldHVybiB7W3N0cmluZ119ICAgICAgW3ByZXR0aWZpZWQgZmlsZXNpemVdXG4gKi9cbnZhciBnZXRSZWFkYWJsZUZpbGVTaXplID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZTtcbiAgICB2YXIgc3RyaW5nO1xuXG4gICAgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQgKiAxMDI0ICogMTAyNCkge1xuICAgICAgICBzaXplID0gc2l6ZSAvICgxMDI0ICogMTAyNCAqIDEwMjQgKiAxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnVEInO1xuICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAxMDI0ICogMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnR0InO1xuICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAxMDI0ICogMTAyNCkge1xuICAgICAgICBzaXplID0gc2l6ZSAvICgxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ01CJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCkge1xuICAgICAgICBzaXplID0gc2l6ZSAvICgxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnS0InO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpemUgPSBzaXplICogMTA7XG4gICAgICAgIHN0cmluZyA9ICdCJztcbiAgICB9XG5cbiAgICByZXR1cm4gKE1hdGgucm91bmQoc2l6ZSkgLyAxMCkgKyAnICcgKyBzdHJpbmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJlYWRhYmxlRmlsZVNpemU7XG4iLCIvKipcbiAqIFtoYXNGaWxlUmVhZGVyIGRlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgaGFzRmlsZVJlYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5GaWxlUmVhZGVyKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaGFzRmlsZVJlYWRlcjtcbiIsInZhciBnZXRGaWxlVHlwZSA9IHJlcXVpcmUoJy4vZ2V0LWZpbGUtdHlwZS5qcycpXG5cbi8qKlxuICogW2lzSW1hZ2UgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19ICBmaWxlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgaXNJbWFnZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuICgvXmltYWdlXFwvLykudGVzdChnZXRGaWxlVHlwZShmaWxlKSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzSW1hZ2U7XG4iLCIvKipcbiAqIFttZXJnZU9wdGlvbnMgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9wdHMgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZGVmYXVsdG9wdGlvbnMgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBtZXJnZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0cywgZGVmYXVsdE9wdGlvbnMsIHNlbGYpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgb3B0aW9ucyA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSBpbiBkZWZhdWx0T3B0aW9ucykge1xuICAgICAgICBpZiAob3B0cyAmJiBvcHRzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBvcHRpb25zW2ldID0gb3B0c1tpXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAob3B0aW9uc1tpXSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zW2ldID0gb3B0aW9uc1tpXS5iaW5kKHNlbGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9uc1tpXSA9IGRlZmF1bHRPcHRpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZXJnZU9wdGlvbnM7XG4iLCIvKipcbiAqIFtub1Byb3BhZ2F0aW9uIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBub1Byb3BhZ2F0aW9uID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICBpZiAoZXZlbnQucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgcmV0dXJuIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZXZlbnQucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbm9Qcm9wYWdhdGlvbjtcbiIsIi8qKlxuICogW3RvQXJyYXkgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9iamVjdCBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciB0b0FycmF5ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmplY3QsIDApO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB0b0FycmF5O1xuIl19
