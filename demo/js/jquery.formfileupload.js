(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/* globals window, document, FileReader, Image */

var mergeOptions        = require('./utils/merge-options.js');
var getFileType         = require('./utils/get-file-type.js');
var getReadableFileSize = require('./utils/get-readable-file-size.js');
var hasFileReader       = require('./utils/has-filereader.js');
var createFileInput     = require('./utils/create-file-input.js');
var noPropagation       = require('./utils/no-propagation.js');
var toArray             = require('./utils/to-array.js');
var isImage             = require('./utils/is-image.js');

var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

var FormFileUpload = function (fileUpload_, opts) {
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
     * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
     * @param  {[object]} file
     * @param  {[object]} trackData
     */
    var trackFile = function (file) {
        trackData.fileNumber  += 1;
        trackData.requestSize += file.size;
    };

    /**
     * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
     * @param  {[object]} file
     * @param  {[object]} trackData
     */
    var untrackFile = function (file) {
        trackData.fileNumber  -= 1;
        trackData.requestSize -= file.size;
    };

    /**
     * [Creates a hidden input field where the base64 data is stored]
     * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
     */
    var addBase64ToDom = function (fileObj) {
        var input = document.createElement('input');

        input.type  = 'hidden';
        input.value = fileObj.data;
        input.name  = 'file:' + fileObj.file.name;

        form.appendChild(input);

        return function () {
            input.parentNode.removeChild(input);
        };
    };

    /**
     * [Creates a list item which gets injected to the DOM]
     * @param {[object]} fileObj             [filedata for adding the filedata & preview to the DOM]
     * @param {[function]} removeFileHandler [callback for notifying that the specified file was deleted]
     */
    var addFileToView = function (fileObj, removeFileHandlerCallback, listElement) {
        var removeButton = document.createElement('span');

        removeButton.className = 'remove';

        listElement.appendChild(removeButton);
        fileView.appendChild(listElement);

        removeButton.addEventListener('click', function () {
            removeFileHandlerCallback(trackData);
            listElement.parentNode.removeChild(listElement);
            untrackFile(fileObj.file);
        });
    };

    /**
     * [if possible adds a thumbnail of the given file to the DOM]
     * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
     * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
     */
    var addThumbnail = function (file, element, options) {
        var canvas      = document.createElement('canvas');
        var factor      = window.devicePixelRatio;
        var imgWrapper  = document.createElement('span');

        imgWrapper.className = 'thumbnail';

        var reader = new FileReader();

        var ctx = canvas.getContext('2d');

        canvas.width  = options.thumbnailSize * factor;
        canvas.height = options.thumbnailSize * factor;

        if (factor > 1) {
            ctx.webkitBackingStorePixelRatio = factor;
            ctx.scale(factor, factor);
        }

        var image = new Image();

        image.addEventListener('load', function () {
            var ratio = this.height / this.width;

            canvas.height = canvas.width * ratio;

            ctx.drawImage(this, 0, 0, options.thumbnailSize * factor, options.thumbnailSize * ratio * factor);
        });

        var fileName = element.querySelector('.js_name');

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
     * [returns the prettified filestype string based on the specified options]
     * @param  {[string]} fileType [mimetype of file]
     * @return {[string]}      [prettified typestring]
     */
    var getReadableFileType = function (fileType, options) {
        return options.acceptedTypes[fileType] || 'unknown filetype';
    };

    var validateFileNumber = function (trackData, options) {
        if (trackData.fileNumber >= options.maxFileNumber) {
            return false;
        }

        return true;
    };

    var validateRequestSize = function (requestSize, options) {
        if (requestSize >= options.maxRequestSize) {
            return false;
        }

        return true;
    };

    var validateFileType = function (fileType, options) {
        if (!options.acceptedTypes[fileType]) {
            return false;
        }

        return true;
    };

    var validateFileSize = function (file, options) {
        if (file.size > options.maxFileSize) {
            return false;
        }

        return true;
    };

    var validateFileName = function (file, options) {
        if (!(options.fileNameRe).test(file.name)) {
            return false;
        }

        return true;
    };

    /**
     * [removes all errors]
     */
    var removeErrors = function (errorWrapper) {
        errorWrapper.innerHTML = '';
    };

    /**
     * [displays the Error message & removes it also after the specified timeout]
     * @param  {[string]} error [error message which has to be displayed]
     */
    var showErrorMessage = function (error) {
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
            var removeHandler = addBase64ToDom(fileObj);
            var fileType      = getReadableFileType(getFileType(fileObj.file), options);
            var listElement   = createListElement(fileObj.file.name, getReadableFileSize(fileObj.file), fileType);

            addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

            if (hasFileReader()) {
                addThumbnail(fileObj.file, listElement, options);
            }
        }
    };

    var validateFile = function (file) {
        if (!validateFileNumber(trackData, options)) {
            return options.maxFileNumberError;
        }

        if (!validateRequestSize(trackData, options)) {
            return options.maxRequestSizeError;
        }

        if (!validateFileType(getFileType(file), options)) {
            return options.invalidFileTypeError;
        }

        if (!validateFileSize(file, options)) {
            return options.maxFileSizeError;
        }

        if (!validateFileName(file, options)) {
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
                showErrorMessage(validateFile(file));

                return false;
            }

            trackFile(file);

            reader.addEventListener('load', function (event) {
                convertBase64FileHandler(null, {
                    data: event.target.result,
                    file: file
                });
            });

            reader.addEventListener('error', function () {
                convertBase64FileHandler(options.unknownFileReaderError);
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
            removeErrors(errorWrapper);

            var file = this.files[0];

            var fileObj = {
                file: file
            };

            var removeHandler = function () {
                untrackFile(file, trackData);
                fileInput.parentNode.removeChild(fileInput);
            };

            if (typeof validateFile(file) === 'string') {
                showErrorMessage(validateFile(file), options.errorTimeoutId, removeErrors, errorWrapper, form, fileView, options);
                fileInput.parentNode.removeChild(fileInput);
            } else {
                var fileType    = getReadableFileType(getFileType(file), options);
                var listElement = createListElement(file.name, fileType, getReadableFileSize(fileObj.file));

                trackFile(file, trackData);

                addFileToView(fileObj, removeHandler, listElement);

                if (hasFileReader()) {
                    addThumbnail(file, listElement, options);
                }

                fileInputs.appendChild(fileInput);
            }

            self.addSelectedFile();
        });
    };

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

},{"./utils/create-file-input.js":2,"./utils/get-file-type.js":3,"./utils/get-readable-file-size.js":4,"./utils/has-filereader.js":5,"./utils/is-image.js":6,"./utils/merge-options.js":7,"./utils/no-propagation.js":8,"./utils/to-array.js":9}],2:[function(require,module,exports){
'use strict';

/**
 * [createInputElement description]
 * @return {[type]} [description]
 */
var createFileInput = function (fileInputId) {
    var fileInput = document.createElement('input');

    fileInput.type      = 'file';
    fileInput.className = 'fileinput';
    fileInput.name      = 'fileinput-' + fileInputId;

    fileInputId += 1;

    return fileInput;
};

module.exports = createFileInput;

},{}],3:[function(require,module,exports){
'use strict';

/**
 * Returns the Filetype
 * @param  {[type]} nativeFile [description]
 * @return {[type]}            [description]
 * Fix chromium issue 105382: Excel (.xls) FileReader mime type is empty.
 */
var getFileType = function (file) {
    if ((/\.xls$/).test(file.name) && !file.type) {
        return 'application/vnd.ms-excel';
    }

    return file.type;
};

module.exports = getFileType;

},{}],4:[function(require,module,exports){
'use strict';

/**
 * Takes the native filesize in bytes and returns the prettified filesize
 * @param  {[object]} file [contains the size of the file]
 * @return {[string]}      [prettified filesize]
 */
var getReadableFileSize = function (file) {
    var string;

    var size = file.size;

    if (size >= 1024 * 1024 * 1024 * 1024) {
        size   = size / (1024 * 1024 * 1024 * 1024 / 10);
        string = 'TB';
    } else if (size >= 1024 * 1024 * 1024) {
        size   = size / (1024 * 1024 * 1024 / 10);
        string = 'GB';
    } else if (size >= 1024 * 1024) {
        size   = size / (1024 * 1024 / 10);
        string = 'MB';
    } else if (size >= 1024) {
        size   = size / (1024 / 10);
        string = 'KB';
    } else {
        size   = size * 10;
        string = 'B';
    }

    return (Math.round(size) / 10) + ' ' + string;
};

module.exports = getReadableFileSize;

},{}],5:[function(require,module,exports){
'use strict';

/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function () {
    return !!(window.File && window.FileList && window.FileReader);
};

module.exports = hasFileReader;

},{}],6:[function(require,module,exports){
'use strict';

var getFileType = require('./get-file-type.js');

/**
 * [isImage description]
 * @param  {[type]}  file [description]
 * @return {Boolean}      [description]
 */
var isImage = function (file) {
    return (/^image\//).test(getFileType(file));
};

module.exports = isImage;

},{"./get-file-type.js":3}],7:[function(require,module,exports){
'use strict';

/**
 * [mergeOptions description]
 * @param  {[type]} opts           [description]
 * @param  {[type]} defaultoptions [description]
 * @return {[type]}                [description]
 */
var mergeOptions = function (opts, defaultOptions, self) {
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

},{}],8:[function(require,module,exports){
'use strict';

/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
var noPropagation = function (event) {
    event.stopPropagation();

    if (event.preventDefault) {
        return event.preventDefault();
    } else {
        event.returnValue = false;
        return false;
    }
};

module.exports = noPropagation;

},{}],9:[function(require,module,exports){
'use strict';

/**
 * [toArray description]
 * @param  {[type]} object [description]
 * @return {[type]}        [description]
 */
var toArray = function (object) {
    return Array.prototype.slice.call(object, 0);
};

module.exports = toArray;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvZmFrZV9jN2M4NzhmLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvY3JlYXRlLWZpbGUtaW5wdXQuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9nZXQtZmlsZS10eXBlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvZ2V0LXJlYWRhYmxlLWZpbGUtc2l6ZS5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2hhcy1maWxlcmVhZGVyLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvaXMtaW1hZ2UuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9tZXJnZS1vcHRpb25zLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvbm8tcHJvcGFnYXRpb24uanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy90by1hcnJheS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBnbG9iYWxzIHdpbmRvdywgZG9jdW1lbnQsIEZpbGVSZWFkZXIsIEltYWdlICovXG5cbnZhciBtZXJnZU9wdGlvbnMgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9tZXJnZS1vcHRpb25zLmpzJyk7XG52YXIgZ2V0RmlsZVR5cGUgICAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0LWZpbGUtdHlwZS5qcycpO1xudmFyIGdldFJlYWRhYmxlRmlsZVNpemUgPSByZXF1aXJlKCcuL3V0aWxzL2dldC1yZWFkYWJsZS1maWxlLXNpemUuanMnKTtcbnZhciBoYXNGaWxlUmVhZGVyICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9oYXMtZmlsZXJlYWRlci5qcycpO1xudmFyIGNyZWF0ZUZpbGVJbnB1dCAgICAgPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZS1maWxlLWlucHV0LmpzJyk7XG52YXIgbm9Qcm9wYWdhdGlvbiAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvbm8tcHJvcGFnYXRpb24uanMnKTtcbnZhciB0b0FycmF5ICAgICAgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy90by1hcnJheS5qcycpO1xudmFyIGlzSW1hZ2UgICAgICAgICAgICAgPSByZXF1aXJlKCcuL3V0aWxzL2lzLWltYWdlLmpzJyk7XG5cbnZhciBFTVBUWV9JTUFHRSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJBUU1BQUFBbDIxYktBQUFBQTFCTVZFVUFBQUNuZWozYUFBQUFBWFJTVGxNQVFPYllaZ0FBQUFwSlJFRlVDTmRqWUFBQUFBSUFBZUlodkRNQUFBQUFTVVZPUks1Q1lJST0nO1xuXG52YXIgRm9ybUZpbGVVcGxvYWQgPSBmdW5jdGlvbiAoZmlsZVVwbG9hZF8sIG9wdHMpIHtcbiAgICB2YXIgZXJyb3JUaW1lb3V0SWQ7XG5cbiAgICB2YXIgZmlsZUlucHV0SWQgPSAwO1xuXG4gICAgdmFyIHRyYWNrRGF0YSA9IHtcbiAgICAgICAgZmlsZU51bWJlcjogMCxcbiAgICAgICAgcmVxdWVzdFNpemU6IDBcbiAgICB9O1xuXG4gICAgdmFyIHNlbGYgICAgICAgICA9IHRoaXM7XG4gICAgdmFyIGRyb3BCb3ggICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19kcm9wYm94Jyk7XG4gICAgdmFyIGZpbGVWaWV3ICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19saXN0Jyk7XG4gICAgdmFyIGZpbGVJbnB1dHMgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19maWxlaW5wdXRzJyk7XG4gICAgdmFyIGZvcm0gICAgICAgICA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19mb3JtJyk7XG4gICAgdmFyIGVycm9yV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciBzZWxlY3RCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIHZhciBkZWZhdWx0T3B0aW9ucyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogW3RpbWVvdXQgc3BlY2lmaWVzIGhvdyBsb25nIHRoZSBlcnJvciBtZXNzYWdlcyBhcmUgZGlzcGxheWVkXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgZXJyb3JNZXNzYWdlVGltZW91dDogNTAwMCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW3RoZSBtYXhpbXVtIGZpbGVzaXplIG9mIGVhY2ggZmlsZSBpbiBieXRlc11cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVTaXplOiAzMTQ1NzI4LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbbWF4RmlsZU51bWJlciBkZWZpbmVzIGhvdyBtYW55IGZpbGVzIGFyZSBhbGxvd2VkIHRvIHVwbG9hZCB3aXRoIGVhY2ggcmVxdWVzdF1cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVOdW1iZXI6IDMsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtTaXplIG9mIHRodW1ibmFpbHMgZGlzcGxheWVkIGluIHRoZSBicm93c2VyIGZvciBwcmV2aWV3IHRoZSBpbWFnZXNdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICB0aHVtYm5haWxTaXplOiAxMDAsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtkZWZpbmVzIHRoZSBtYXhpbXVtIHNpemUgb2YgZWFjaCByZXF1ZXN0IGluIGJ5dGVzXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4UmVxdWVzdFNpemU6IDk0MzcxODQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtJZiB0cnVlIHRoZSBmYWxsYmFjayBmb3IgSUU4IGlzIGFjdGl2YXRlZF1cbiAgICAgICAgICogQHR5cGUge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBmYWxsYmFja0ZvcklFODogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW1JlZ3VsYXIgRXhwcmVzc2lvbiBmb3IgZmlsZW5hbWUgbWF0Y2hpbmddXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWxlTmFtZVJlOiAvXltBLVphLXowLTkuXFwtXyBdKyQvLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBmaWxlIGhhcyBjaGFyYWN0ZXJzIHdoaWNoIGFyZSBub3QgYWxsb3dlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGludmFsaWRGaWxlTmFtZUVycm9yOiAnVGhlIG5hbWUgb2YgdGhlIGZpbGUgaGFzIGZvcmJpZGRlbiBjaGFyYWN0ZXJzJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgZmlsZXR5cGUgaXMgbm90IGFsbG93ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpbnZhbGlkRmlsZVR5cGVFcnJvcjogJ1RoZSBmaWxlZm9ybWF0IGlzIG5vdCBhbGxvd2VkJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgbWF4LiByZXF1ZXN0c2l6ZSBpcyByZWFjaGVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4UmVxdWVzdFNpemVFcnJvcjogJ1RoZSByZXF1ZXN0c2l6ZSBvZiB0aGUgZmlsZXMgeW91IHdhbnQgdG8gdXBsb2FkIGlzIGV4Y2VlZGVkLicsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gZmlsZW51bWJlciBpcyByZWFjaGVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgbWF4RmlsZU51bWJlckVycm9yOiAnWW91IGNhbiB1cGxvYWQgMyBmaWxlcywgbm90IG1vcmUhJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgbWF4LiBmaWxlbnNpemUgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVTaXplRXJyb3I6ICdPbmUgb2YgdGhlIGZpbGVzIGlzIHRvbyBsYXJnZS4gdGhlIG1heGltdW0gZmlsZXNpemUgaXMgMyBNQi4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbSWYgc29tZXRoaW5nIGR1cmluZyB0aGUgZmlsZXJlYWRpbmcgcHJvY2VzcyB3ZW50IHdyb25nLCB0aGVuIHRoaXMgbWVzc2FnZSBpcyBkaXNwbGF5ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1bmtub3duRmlsZVJlYWRlckVycm9yOiAnVW5rbm93biBFcnJvciB3aGlsZSBsb2FkaW5nIHRoZSBmaWxlLicsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtPYmplY3RzIGNvbnRhaW5zIGFsbCBhbGxvd2VkIG1pbWV0eXBlcyBhcyBrZXlzICYgdGhlIHByZXR0aWZpZWQgZmlsZW5hbWVzIGFzIHZhbHVlc11cbiAgICAgICAgICogQHR5cGUge09iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGFjY2VwdGVkVHlwZXM6IHtcbiAgICAgICAgICAgICdpbWFnZS9wbmcnOiAnUE5HLUJpbGQnLFxuICAgICAgICAgICAgJ2ltYWdlL2pwZWcnOiAnSlBFRy1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS9naWYnOiAnR0lGLUJpbGQnLFxuICAgICAgICAgICAgJ2ltYWdlL3RpZmYnOiAnVElGRi1CaWxkJyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9wZGYnOiAnUERGLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnOiAnRXhjZWwtRG9rdW1lbnQnLFxuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5zcHJlYWRzaGVldG1sLnNoZWV0JzogJ0V4Y2VsLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9tc3dvcmQnOiAnV29yZC1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LndvcmRwcm9jZXNzaW5nbWwuZG9jdW1lbnQnOiAnV29yZC1Eb2t1bWVudCdcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNZXJnaW5nIHRoZSBkZWZhdWx0IG9wdGlvbnMgd2l0aCB0aGUgdXNlciBwYXNzZWQgb3B0aW9ucyB0b2dldGhlclxuICAgICAqIEB0eXBlIHtbb2JqZWN0XX1cbiAgICAgKi9cbiAgICB2YXIgb3B0aW9ucyA9IG1lcmdlT3B0aW9ucyhvcHRzLCBkZWZhdWx0T3B0aW9ucywgc2VsZik7XG5cbiAgICAvKipcbiAgICAgKiBbaW5jcmVtZW50IHRoZSBmaWxlbnVtYmVyIGZvciBlYWNoIGRyb3BwZWQgZmlsZSBieSBvbmUgJiBpbmNyZW1lbnQgdGhlIHJlcXVlc3RzaXplIGJ5IHRoZSBjdXJyZW50IGZpbGVzaXplXVxuICAgICAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlXG4gICAgICogQHBhcmFtICB7W29iamVjdF19IHRyYWNrRGF0YVxuICAgICAqL1xuICAgIHZhciB0cmFja0ZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB0cmFja0RhdGEuZmlsZU51bWJlciAgKz0gMTtcbiAgICAgICAgdHJhY2tEYXRhLnJlcXVlc3RTaXplICs9IGZpbGUuc2l6ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2RlY3JlbWVudCB0aGUgZmlsZW51bWJlciBmb3IgZWFjaCBkZWxldGVkIGZpbGUgYnkgb25lICYgZGVjcmVtZW50IHRoZSByZXF1ZXN0c2l6ZSBieSB0aGUgY3VycmVudCBmaWxlc2l6ZV1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZVxuICAgICAqIEBwYXJhbSAge1tvYmplY3RdfSB0cmFja0RhdGFcbiAgICAgKi9cbiAgICB2YXIgdW50cmFja0ZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB0cmFja0RhdGEuZmlsZU51bWJlciAgLT0gMTtcbiAgICAgICAgdHJhY2tEYXRhLnJlcXVlc3RTaXplIC09IGZpbGUuc2l6ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW0NyZWF0ZXMgYSBoaWRkZW4gaW5wdXQgZmllbGQgd2hlcmUgdGhlIGJhc2U2NCBkYXRhIGlzIHN0b3JlZF1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZU9iaiBbdGhlIGJhc2U2NCBzdHJpbmcgJiBhbGwgbWV0YWRhdGEgY29tYmluZWQgaW4gb25lIG9iamVjdF1cbiAgICAgKi9cbiAgICB2YXIgYWRkQmFzZTY0VG9Eb20gPSBmdW5jdGlvbiAoZmlsZU9iaikge1xuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgICAgIGlucHV0LnR5cGUgID0gJ2hpZGRlbic7XG4gICAgICAgIGlucHV0LnZhbHVlID0gZmlsZU9iai5kYXRhO1xuICAgICAgICBpbnB1dC5uYW1lICA9ICdmaWxlOicgKyBmaWxlT2JqLmZpbGUubmFtZTtcblxuICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dCk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtDcmVhdGVzIGEgbGlzdCBpdGVtIHdoaWNoIGdldHMgaW5qZWN0ZWQgdG8gdGhlIERPTV1cbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBmaWxlT2JqICAgICAgICAgICAgIFtmaWxlZGF0YSBmb3IgYWRkaW5nIHRoZSBmaWxlZGF0YSAmIHByZXZpZXcgdG8gdGhlIERPTV1cbiAgICAgKiBAcGFyYW0ge1tmdW5jdGlvbl19IHJlbW92ZUZpbGVIYW5kbGVyIFtjYWxsYmFjayBmb3Igbm90aWZ5aW5nIHRoYXQgdGhlIHNwZWNpZmllZCBmaWxlIHdhcyBkZWxldGVkXVxuICAgICAqL1xuICAgIHZhciBhZGRGaWxlVG9WaWV3ID0gZnVuY3Rpb24gKGZpbGVPYmosIHJlbW92ZUZpbGVIYW5kbGVyQ2FsbGJhY2ssIGxpc3RFbGVtZW50KSB7XG4gICAgICAgIHZhciByZW1vdmVCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAgICAgcmVtb3ZlQnV0dG9uLmNsYXNzTmFtZSA9ICdyZW1vdmUnO1xuXG4gICAgICAgIGxpc3RFbGVtZW50LmFwcGVuZENoaWxkKHJlbW92ZUJ1dHRvbik7XG4gICAgICAgIGZpbGVWaWV3LmFwcGVuZENoaWxkKGxpc3RFbGVtZW50KTtcblxuICAgICAgICByZW1vdmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZW1vdmVGaWxlSGFuZGxlckNhbGxiYWNrKHRyYWNrRGF0YSk7XG4gICAgICAgICAgICBsaXN0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpc3RFbGVtZW50KTtcbiAgICAgICAgICAgIHVudHJhY2tGaWxlKGZpbGVPYmouZmlsZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbaWYgcG9zc2libGUgYWRkcyBhIHRodW1ibmFpbCBvZiB0aGUgZ2l2ZW4gZmlsZSB0byB0aGUgRE9NXVxuICAgICAqIEBwYXJhbSB7W29iamVjdF19ICAgICBmaWxlICAgIFtmaWxlZGF0YSB0byBjcmVhdGUgYSB0aHVtYm5haWwgd2hpY2ggZ2V0cyBpbmplY3RlZF1cbiAgICAgKiBAcGFyYW0ge1tET00gb2JqZWN0XX0gZWxlbWVudCBbRE9NIGVsZW1lbnQgdG8gc3BlY2lmeSB3aGVyZSB0aGUgdGh1bWJuYWlsIGhhcyB0byBiZSBpbmplY3RlZF1cbiAgICAgKi9cbiAgICB2YXIgYWRkVGh1bWJuYWlsID0gZnVuY3Rpb24gKGZpbGUsIGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGNhbnZhcyAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHZhciBmYWN0b3IgICAgICA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICB2YXIgaW1nV3JhcHBlciAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAgICAgaW1nV3JhcHBlci5jbGFzc05hbWUgPSAndGh1bWJuYWlsJztcblxuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICB2YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgY2FudmFzLndpZHRoICA9IG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3RvcjtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3RvcjtcblxuICAgICAgICBpZiAoZmFjdG9yID4gMSkge1xuICAgICAgICAgICAgY3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gPSBmYWN0b3I7XG4gICAgICAgICAgICBjdHguc2NhbGUoZmFjdG9yLCBmYWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG5cbiAgICAgICAgaW1hZ2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByYXRpbyA9IHRoaXMuaGVpZ2h0IC8gdGhpcy53aWR0aDtcblxuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhcy53aWR0aCAqIHJhdGlvO1xuXG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMsIDAsIDAsIG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3Rvciwgb3B0aW9ucy50aHVtYm5haWxTaXplICogcmF0aW8gKiBmYWN0b3IpO1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZmlsZU5hbWUgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19uYW1lJyk7XG5cbiAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChpc0ltYWdlKGZpbGUpKSB7XG4gICAgICAgICAgICAgICAgaW1hZ2Uuc3JjID0gZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaW1hZ2Uuc3JjID0gRU1QVFlfSU1BR0U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGltZ1dyYXBwZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcbiAgICAgICAgICAgIGVsZW1lbnQuaW5zZXJ0QmVmb3JlKGltZ1dyYXBwZXIsIGZpbGVOYW1lKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtDcmVhdGVzIGEgbGlzdEVsZW1lbnQgd2l0aCB0aGUgZGF0YSBvZiB0aGUgcGFzc2VkIG9iamVjdF1cbiAgICAgKiBAcGFyYW0gIHtbdHlwZV19IGZpbGVPYmogW3VzZWQgdG8gcHV0IHRoZSBpbmZvcm1hdGlvbiBvZiB0aGUgZmlsZSBpbiB0aGUgbGlzdEVsZW1lbXRdXG4gICAgICogQHJldHVybiB7W29iamVjdF19ICAgICAgIFt0aGUgbGlzdEVsZW1lbnQgd2hpY2ggZ2V0cyBpbmplY3RlZCBpbiB0aGUgRE9NXVxuICAgICAqL1xuICAgIHZhciBjcmVhdGVMaXN0RWxlbWVudCA9IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVNpemUsIGZpbGVUeXBlKSB7XG4gICAgICAgIHZhciBmaWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cbiAgICAgICAgZmlsZUVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZpbGUnO1xuXG4gICAgICAgIGZpbGVFbGVtZW50LmlubmVySFRNTCA9IFtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwganNfbmFtZSBuYW1lXCI+JyxcbiAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJsYWJlbCBzaXplXCI+JyxcbiAgICAgICAgZmlsZVNpemUsXG4gICAgICAgICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJsYWJlbCB0eXBlXCI+JyxcbiAgICAgICAgZmlsZVR5cGUsXG4gICAgICAgICc8L3NwYW4+JyBdLmpvaW4oJycpO1xuXG4gICAgICAgIHJldHVybiBmaWxlRWxlbWVudDtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW3JldHVybnMgdGhlIHByZXR0aWZpZWQgZmlsZXN0eXBlIHN0cmluZyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIG9wdGlvbnNdXG4gICAgICogQHBhcmFtICB7W3N0cmluZ119IGZpbGVUeXBlIFttaW1ldHlwZSBvZiBmaWxlXVxuICAgICAqIEByZXR1cm4ge1tzdHJpbmddfSAgICAgIFtwcmV0dGlmaWVkIHR5cGVzdHJpbmddXG4gICAgICovXG4gICAgdmFyIGdldFJlYWRhYmxlRmlsZVR5cGUgPSBmdW5jdGlvbiAoZmlsZVR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuYWNjZXB0ZWRUeXBlc1tmaWxlVHlwZV0gfHwgJ3Vua25vd24gZmlsZXR5cGUnO1xuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVGaWxlTnVtYmVyID0gZnVuY3Rpb24gKHRyYWNrRGF0YSwgb3B0aW9ucykge1xuICAgICAgICBpZiAodHJhY2tEYXRhLmZpbGVOdW1iZXIgPj0gb3B0aW9ucy5tYXhGaWxlTnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlUmVxdWVzdFNpemUgPSBmdW5jdGlvbiAocmVxdWVzdFNpemUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHJlcXVlc3RTaXplID49IG9wdGlvbnMubWF4UmVxdWVzdFNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVGaWxlVHlwZSA9IGZ1bmN0aW9uIChmaWxlVHlwZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMuYWNjZXB0ZWRUeXBlc1tmaWxlVHlwZV0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVGaWxlU2l6ZSA9IGZ1bmN0aW9uIChmaWxlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChmaWxlLnNpemUgPiBvcHRpb25zLm1heEZpbGVTaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZU5hbWUgPSBmdW5jdGlvbiAoZmlsZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAoIShvcHRpb25zLmZpbGVOYW1lUmUpLnRlc3QoZmlsZS5uYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtyZW1vdmVzIGFsbCBlcnJvcnNdXG4gICAgICovXG4gICAgdmFyIHJlbW92ZUVycm9ycyA9IGZ1bmN0aW9uIChlcnJvcldyYXBwZXIpIHtcbiAgICAgICAgZXJyb3JXcmFwcGVyLmlubmVySFRNTCA9ICcnO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbZGlzcGxheXMgdGhlIEVycm9yIG1lc3NhZ2UgJiByZW1vdmVzIGl0IGFsc28gYWZ0ZXIgdGhlIHNwZWNpZmllZCB0aW1lb3V0XVxuICAgICAqIEBwYXJhbSAge1tzdHJpbmddfSBlcnJvciBbZXJyb3IgbWVzc2FnZSB3aGljaCBoYXMgdG8gYmUgZGlzcGxheWVkXVxuICAgICAqL1xuICAgIHZhciBzaG93RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIHZhciBlcnJvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgICAgIGVycm9yRWxlbWVudC5jbGFzc05hbWUgPSAnZXJyb3InO1xuICAgICAgICBlcnJvckVsZW1lbnQuaW5uZXJIVE1MID0gZXJyb3I7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KGVycm9yVGltZW91dElkKTtcblxuICAgICAgICBlcnJvclRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVtb3ZlRXJyb3JzKGVycm9yV3JhcHBlcik7XG4gICAgICAgIH0sIG9wdGlvbnMuZXJyb3JNZXNzYWdlVGltZW91dCk7XG5cbiAgICAgICAgZXJyb3JXcmFwcGVyLmFwcGVuZENoaWxkKGVycm9yRWxlbWVudCk7XG4gICAgICAgIGZvcm0uaW5zZXJ0QmVmb3JlKGVycm9yV3JhcHBlciwgZmlsZVZpZXcpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIENhbGxiYWNrIGZ1bmN0aW9uIGZvciBoYW5kbGluZyB0aGUgYXN5bmMgZmlsZXJlYWRlciByZXNwb25zZVxuICAgICAqIEBwYXJhbSAge1tzdHJpbmddfSBlcnIgICAgIFt0aGUgZXJyb3JtZXNzYWdlIHdoaWNoIGdldHMgdGhyb3duIHdoZW4gdGhlIGZpbGVyZWFkZXIgZXJyb3JlZF1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZU9iaiBbdGhlIGJhc2U2NCBzdHJpbmcgJiBhbGwgbWV0YWRhdGEgY29tYmluZWQgaW4gb25lIG9iamVjdF1cbiAgICAgKi9cbiAgICB2YXIgY29udmVydEJhc2U2NEZpbGVIYW5kbGVyID0gZnVuY3Rpb24gKGVyciwgZmlsZU9iaikge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZpbGVPYmopIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVIYW5kbGVyID0gYWRkQmFzZTY0VG9Eb20oZmlsZU9iaik7XG4gICAgICAgICAgICB2YXIgZmlsZVR5cGUgICAgICA9IGdldFJlYWRhYmxlRmlsZVR5cGUoZ2V0RmlsZVR5cGUoZmlsZU9iai5maWxlKSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgbGlzdEVsZW1lbnQgICA9IGNyZWF0ZUxpc3RFbGVtZW50KGZpbGVPYmouZmlsZS5uYW1lLCBnZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSksIGZpbGVUeXBlKTtcblxuICAgICAgICAgICAgYWRkRmlsZVRvVmlldyhmaWxlT2JqLCByZW1vdmVIYW5kbGVyLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCk7XG5cbiAgICAgICAgICAgIGlmIChoYXNGaWxlUmVhZGVyKCkpIHtcbiAgICAgICAgICAgICAgICBhZGRUaHVtYm5haWwoZmlsZU9iai5maWxlLCBsaXN0RWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgIGlmICghdmFsaWRhdGVGaWxlTnVtYmVyKHRyYWNrRGF0YSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLm1heEZpbGVOdW1iZXJFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdmFsaWRhdGVSZXF1ZXN0U2l6ZSh0cmFja0RhdGEsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhSZXF1ZXN0U2l6ZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWxpZGF0ZUZpbGVUeXBlKGdldEZpbGVUeXBlKGZpbGUpLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW52YWxpZEZpbGVUeXBlRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZhbGlkYXRlRmlsZVNpemUoZmlsZSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLm1heEZpbGVTaXplRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZhbGlkYXRlRmlsZU5hbWUoZmlsZSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmludmFsaWRGaWxlTmFtZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtjb252ZXJ0cyB0aGUgZmlsZWRhdGEgaW50byBhIGJhc2U2NCBzdHJpbmcgYW5kIHZhbGlkYXRlcyB0aGUgZmlsZWRhdGFdXG4gICAgICogQHBhcmFtICB7W2FycmF5XX0gIGZpbGVzICBbdGhlIGNvbnZlcnRlZCBmaWxlTGlzdE9iamVjdF1cbiAgICAgKi9cbiAgICB0aGlzLmNvbnZlcnRGaWxlc1RvQmFzZTY0ID0gZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgIGZpbGVzLmV2ZXJ5KGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWxpZGF0ZUZpbGUoZmlsZSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgc2hvd0Vycm9yTWVzc2FnZSh2YWxpZGF0ZUZpbGUoZmlsZSkpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0cmFja0ZpbGUoZmlsZSk7XG5cbiAgICAgICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgY29udmVydEJhc2U2NEZpbGVIYW5kbGVyKG51bGwsIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZXZlbnQudGFyZ2V0LnJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb252ZXJ0QmFzZTY0RmlsZUhhbmRsZXIob3B0aW9ucy51bmtub3duRmlsZVJlYWRlckVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbQWRkIGEgZmlsZUlucHV0IHdpdGggdGhlIHNlbGVjdGVkIGZpbGUgdG8gZm9ybV1cbiAgICAgKi9cbiAgICB0aGlzLmFkZFNlbGVjdGVkRmlsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGZpbGVJbnB1dCA9IGNyZWF0ZUZpbGVJbnB1dChmaWxlSW5wdXRJZCk7XG5cbiAgICAgICAgZm9ybS5pbnNlcnRCZWZvcmUoc2VsZWN0QnV0dG9uLCBkcm9wQm94KTtcbiAgICAgICAgc2VsZWN0QnV0dG9uLmFwcGVuZENoaWxkKGZpbGVJbnB1dCk7XG5cbiAgICAgICAgZmlsZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlbW92ZUVycm9ycyhlcnJvcldyYXBwZXIpO1xuXG4gICAgICAgICAgICB2YXIgZmlsZSA9IHRoaXMuZmlsZXNbMF07XG5cbiAgICAgICAgICAgIHZhciBmaWxlT2JqID0ge1xuICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVIYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHVudHJhY2tGaWxlKGZpbGUsIHRyYWNrRGF0YSk7XG4gICAgICAgICAgICAgICAgZmlsZUlucHV0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsaWRhdGVGaWxlKGZpbGUpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UodmFsaWRhdGVGaWxlKGZpbGUpLCBvcHRpb25zLmVycm9yVGltZW91dElkLCByZW1vdmVFcnJvcnMsIGVycm9yV3JhcHBlciwgZm9ybSwgZmlsZVZpZXcsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGZpbGVJbnB1dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZpbGVJbnB1dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlVHlwZSAgICA9IGdldFJlYWRhYmxlRmlsZVR5cGUoZ2V0RmlsZVR5cGUoZmlsZSksIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHZhciBsaXN0RWxlbWVudCA9IGNyZWF0ZUxpc3RFbGVtZW50KGZpbGUubmFtZSwgZmlsZVR5cGUsIGdldFJlYWRhYmxlRmlsZVNpemUoZmlsZU9iai5maWxlKSk7XG5cbiAgICAgICAgICAgICAgICB0cmFja0ZpbGUoZmlsZSwgdHJhY2tEYXRhKTtcblxuICAgICAgICAgICAgICAgIGFkZEZpbGVUb1ZpZXcoZmlsZU9iaiwgcmVtb3ZlSGFuZGxlciwgbGlzdEVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0ZpbGVSZWFkZXIoKSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRUaHVtYm5haWwoZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZpbGVJbnB1dHMuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5hZGRTZWxlY3RlZEZpbGUoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIElmIHRoZXJlIGlzIG5vIGZpbGVyZWFkZXIgYXZhaWxhYmxlLCB0aGVuIHRoZSBkcm9wem9uZSBzaG91bGQgbm90IGJlIGRpc3BsYXllZCBhbmQgdGhlIEZhbGxiYWNrIGlzIGRpc3BsYXllZFxuICAgICAqL1xuICAgIGlmICghaGFzRmlsZVJlYWRlcigpICYmIG9wdGlvbnMuZmFsbGJhY2tGb3JJRTgpIHtcbiAgICAgICAgc2VsZWN0QnV0dG9uLmNsYXNzTmFtZSA9ICdzZWxlY3RidXR0b24ganNfc2VsZWN0YnV0dG9uJztcblxuICAgICAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICBzcGFuLmlubmVySFRNTCA9ICdTZWxlY3QgRmlsZSc7XG5cbiAgICAgICAgc2VsZWN0QnV0dG9uLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICBzZWxmLmFkZFNlbGVjdGVkRmlsZSgpO1xuXG4gICAgICAgIGRyb3BCb3guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBkcm9waGFuZGxlciBjYWxscyB0aGUgZG5kSGFuZGxlciBhbHdheXMgd2hlbm4gYSBmaWxlIGdldHMgZHJvcHBlZFxuICAgICAqIEBwYXJhbSB7W29iamVjdF19IGV2ZW50IFtkcm9wRXZlbnQgd2hlcmUgdGhlIGZpbGVsaXN0IGlzIGJpbmRlZF1cbiAgICAgKi9cbiAgICBkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG5cbiAgICAgICAgdmFyIGZpbGVzID0gdG9BcnJheShldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuXG4gICAgICAgIHNlbGYuY29udmVydEZpbGVzVG9CYXNlNjQoZmlsZXMpO1xuXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuICAgIGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIG5vUHJvcGFnYXRpb24oZXZlbnQpO1xuXG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuICAgIGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG5cbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRm9ybUZpbGVVcGxvYWQ7XG5cbi8qIGdsb2JhbHMgJCwgRm9ybUZpbGVVcGxvYWQgKi9cblxuJC5mbi5mb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnM7XG5cbiAgICAgICAgaWYgKCEkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJykpIHtcbiAgICAgICAgICAgIGluc3RhbmNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLCAkKHRoaXMpLmRhdGEoKSk7XG4gICAgICAgICAgICAkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJywgbmV3IEZvcm1GaWxlVXBsb2FkKHRoaXMsIGluc3RhbmNlT3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFtjcmVhdGVJbnB1dEVsZW1lbnQgZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19IFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGNyZWF0ZUZpbGVJbnB1dCA9IGZ1bmN0aW9uIChmaWxlSW5wdXRJZCkge1xuICAgIHZhciBmaWxlSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgZmlsZUlucHV0LnR5cGUgICAgICA9ICdmaWxlJztcbiAgICBmaWxlSW5wdXQuY2xhc3NOYW1lID0gJ2ZpbGVpbnB1dCc7XG4gICAgZmlsZUlucHV0Lm5hbWUgICAgICA9ICdmaWxlaW5wdXQtJyArIGZpbGVJbnB1dElkO1xuXG4gICAgZmlsZUlucHV0SWQgKz0gMTtcblxuICAgIHJldHVybiBmaWxlSW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUZpbGVJbnB1dDtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBGaWxldHlwZVxuICogQHBhcmFtICB7W3R5cGVdfSBuYXRpdmVGaWxlIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBGaXggY2hyb21pdW0gaXNzdWUgMTA1MzgyOiBFeGNlbCAoLnhscykgRmlsZVJlYWRlciBtaW1lIHR5cGUgaXMgZW1wdHkuXG4gKi9cbnZhciBnZXRGaWxlVHlwZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgaWYgKCgvXFwueGxzJC8pLnRlc3QoZmlsZS5uYW1lKSAmJiAhZmlsZS50eXBlKSB7XG4gICAgICAgIHJldHVybiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJztcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsZS50eXBlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRGaWxlVHlwZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUYWtlcyB0aGUgbmF0aXZlIGZpbGVzaXplIGluIGJ5dGVzIGFuZCByZXR1cm5zIHRoZSBwcmV0dGlmaWVkIGZpbGVzaXplXG4gKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZSBbY29udGFpbnMgdGhlIHNpemUgb2YgdGhlIGZpbGVdXG4gKiBAcmV0dXJuIHtbc3RyaW5nXX0gICAgICBbcHJldHRpZmllZCBmaWxlc2l6ZV1cbiAqL1xudmFyIGdldFJlYWRhYmxlRmlsZVNpemUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgIHZhciBzdHJpbmc7XG5cbiAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZTtcblxuICAgIGlmIChzaXplID49IDEwMjQgKiAxMDI0ICogMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSAgID0gc2l6ZSAvICgxMDI0ICogMTAyNCAqIDEwMjQgKiAxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnVEInO1xuICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAxMDI0ICogMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSAgID0gc2l6ZSAvICgxMDI0ICogMTAyNCAqIDEwMjQgLyAxMCk7XG4gICAgICAgIHN0cmluZyA9ICdHQic7XG4gICAgfSBlbHNlIGlmIChzaXplID49IDEwMjQgKiAxMDI0KSB7XG4gICAgICAgIHNpemUgICA9IHNpemUgLyAoMTAyNCAqIDEwMjQgLyAxMCk7XG4gICAgICAgIHN0cmluZyA9ICdNQic7XG4gICAgfSBlbHNlIGlmIChzaXplID49IDEwMjQpIHtcbiAgICAgICAgc2l6ZSAgID0gc2l6ZSAvICgxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnS0InO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpemUgICA9IHNpemUgKiAxMDtcbiAgICAgICAgc3RyaW5nID0gJ0InO1xuICAgIH1cblxuICAgIHJldHVybiAoTWF0aC5yb3VuZChzaXplKSAvIDEwKSArICcgJyArIHN0cmluZztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0UmVhZGFibGVGaWxlU2l6ZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBbaGFzRmlsZVJlYWRlciBkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59IFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGhhc0ZpbGVSZWFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuRmlsZVJlYWRlcik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGhhc0ZpbGVSZWFkZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBnZXRGaWxlVHlwZSA9IHJlcXVpcmUoJy4vZ2V0LWZpbGUtdHlwZS5qcycpO1xuXG4vKipcbiAqIFtpc0ltYWdlIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSAgZmlsZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGlzSW1hZ2UgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgIHJldHVybiAoL15pbWFnZVxcLy8pLnRlc3QoZ2V0RmlsZVR5cGUoZmlsZSkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0ltYWdlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFttZXJnZU9wdGlvbnMgZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IG9wdHMgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZGVmYXVsdG9wdGlvbnMgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBtZXJnZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0cywgZGVmYXVsdE9wdGlvbnMsIHNlbGYpIHtcbiAgICB2YXIgb3B0aW9ucyA9IHt9O1xuXG4gICAgZm9yICh2YXIgaSBpbiBkZWZhdWx0T3B0aW9ucykge1xuICAgICAgICBpZiAob3B0cyAmJiBvcHRzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICBvcHRpb25zW2ldID0gb3B0c1tpXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiAob3B0aW9uc1tpXSkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zW2ldID0gb3B0aW9uc1tpXS5iaW5kKHNlbGYpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0aW9uc1tpXSA9IGRlZmF1bHRPcHRpb25zW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcHRpb25zO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtZXJnZU9wdGlvbnM7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogW25vUHJvcGFnYXRpb24gZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIG5vUHJvcGFnYXRpb24gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICByZXR1cm4gZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBub1Byb3BhZ2F0aW9uO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFt0b0FycmF5IGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBvYmplY3QgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgdG9BcnJheSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqZWN0LCAwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdG9BcnJheTtcbiJdfQ==
