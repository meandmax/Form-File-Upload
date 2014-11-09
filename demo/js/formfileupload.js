!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.FormFileUpload=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/* globals document, FileReader */

var mergeOptions        = _dereq_('./utils/merge-options.js');
var getFileType         = _dereq_('./utils/get-file-type.js');
var getReadableFileSize = _dereq_('./utils/get-readable-file-size.js');
var hasFileReader       = _dereq_('./utils/has-filereader.js');
var createFileInput     = _dereq_('./utils/create-file-input.js');
var noPropagation       = _dereq_('./utils/no-propagation.js');
var toArray             = _dereq_('./utils/to-array.js');

var formUploadUtils     = _dereq_('./formfileuploadutils.js');

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

},{"./formfileuploadutils.js":2,"./utils/create-file-input.js":3,"./utils/get-file-type.js":4,"./utils/get-readable-file-size.js":5,"./utils/has-filereader.js":6,"./utils/merge-options.js":8,"./utils/no-propagation.js":9,"./utils/to-array.js":10}],2:[function(_dereq_,module,exports){
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

    var isImage = _dereq_('./utils/is-image.js');

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

},{"./utils/is-image.js":7}],3:[function(_dereq_,module,exports){
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

},{}],4:[function(_dereq_,module,exports){
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

},{}],5:[function(_dereq_,module,exports){
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

},{}],6:[function(_dereq_,module,exports){
/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function () {
    'use strict';

    return !!(window.File && window.FileList && window.FileReader);
};

module.exports = hasFileReader;

},{}],7:[function(_dereq_,module,exports){
var getFileType = _dereq_('./get-file-type.js')

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

},{"./get-file-type.js":4}],8:[function(_dereq_,module,exports){
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

},{}],9:[function(_dereq_,module,exports){
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

},{}],10:[function(_dereq_,module,exports){
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
(1)
});