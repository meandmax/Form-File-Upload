(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* globals window, document, FileReader, Image */

var mergeOptions        = require('./utils/merge-options.js');
var getFileType         = require('./utils/get-file-type.js');
var getReadableFileSize = require('./utils/get-readable-file-size.js');
var hasFileReader       = require('./utils/has-filereader.js');
var createFileInput     = require('./utils/create-file-input.js');
var noPropagation       = require('./utils/no-propagation.js');
var toArray             = require('./utils/to-array.js');

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
     * [increment the filenumber for each dropped file by one & increment the requestsize by the current filesize]
     * @param  {[object]} file
     * @param  {[object]} trackData
     */
    var trackFile = function (file, trackData) {
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
     * [Creates a hidden input field where the base64 data is stored]
     * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
     */
    var addBase64ToDom = function (fileObj, form) {
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
     * [Creates a list item which gets injected to the DOM]
     * @param {[object]} fileObj             [filedata for adding the filedata & preview to the DOM]
     * @param {[function]} removeFileHandler [callback for notifying that the specified file was deleted]
     */
    var addFileToView = function (fileObj, removeFileHandlerCallback, trackData, fileView, listElement) {
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
     * [if possible adds a thumbnail of the given file to the DOM]
     * @param {[object]}     file    [filedata to create a thumbnail which gets injected]
     * @param {[DOM object]} element [DOM element to specify where the thumbnail has to be injected]
     */
    var addThumbnail = function (file, element, options) {
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
     * [displays the Error message & removes it also after the specified timeout]
     * @param  {[string]} error [error message which has to be displayed]
     */
    var showErrorMessage = function (error, errorTimeoutId, removeErrors, errorWrapper, form, fileView, options) {
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
        errorWrapper.innerHTML = '';
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
            var removeHandler = addBase64ToDom(fileObj, form);
            var fileType = getReadableFileType(getFileType(fileObj.file), options);
            var listElement = createListElement(fileObj.file.name, getReadableFileSize(fileObj.file), fileType);
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
                showErrorMessage(validateFile(file), errorTimeoutId, removeErrors, errorWrapper, form, fileView, options);
                return false;
            }

            trackFile(file, trackData);

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
                var fileType = getReadableFileType(getFileType(file), options);
                var listElement = createListElement(file.name, fileType, getReadableFileSize(fileObj.file));

                trackFile(file, trackData);
                addFileToView(fileObj, removeHandler, trackData, fileView, listElement);

                if (hasFileReader()) {
                    addThumbnail(file, listElement, options);
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

},{"./utils/create-file-input.js":2,"./utils/get-file-type.js":3,"./utils/get-readable-file-size.js":4,"./utils/has-filereader.js":5,"./utils/is-image.js":6,"./utils/merge-options.js":7,"./utils/no-propagation.js":8,"./utils/to-array.js":9}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function () {
    'use strict';

    return !!(window.File && window.FileList && window.FileReader);
};

module.exports = hasFileReader;

},{}],6:[function(require,module,exports){
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

},{"./get-file-type.js":3}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvZmFrZV85ZDEyNTJkOC5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2NyZWF0ZS1maWxlLWlucHV0LmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvZ2V0LWZpbGUtdHlwZS5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2dldC1yZWFkYWJsZS1maWxlLXNpemUuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9oYXMtZmlsZXJlYWRlci5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2lzLWltYWdlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvbWVyZ2Utb3B0aW9ucy5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL25vLXByb3BhZ2F0aW9uLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvdG8tYXJyYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWxzIHdpbmRvdywgZG9jdW1lbnQsIEZpbGVSZWFkZXIsIEltYWdlICovXG5cbnZhciBtZXJnZU9wdGlvbnMgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9tZXJnZS1vcHRpb25zLmpzJyk7XG52YXIgZ2V0RmlsZVR5cGUgICAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvZ2V0LWZpbGUtdHlwZS5qcycpO1xudmFyIGdldFJlYWRhYmxlRmlsZVNpemUgPSByZXF1aXJlKCcuL3V0aWxzL2dldC1yZWFkYWJsZS1maWxlLXNpemUuanMnKTtcbnZhciBoYXNGaWxlUmVhZGVyICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9oYXMtZmlsZXJlYWRlci5qcycpO1xudmFyIGNyZWF0ZUZpbGVJbnB1dCAgICAgPSByZXF1aXJlKCcuL3V0aWxzL2NyZWF0ZS1maWxlLWlucHV0LmpzJyk7XG52YXIgbm9Qcm9wYWdhdGlvbiAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvbm8tcHJvcGFnYXRpb24uanMnKTtcbnZhciB0b0FycmF5ICAgICAgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy90by1hcnJheS5qcycpO1xuXG52YXIgRm9ybUZpbGVVcGxvYWQgPSBmdW5jdGlvbiAoZmlsZVVwbG9hZF8sIG9wdHMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZXJyb3JUaW1lb3V0SWQ7XG4gICAgdmFyIGZpbGVJbnB1dElkID0gMDtcblxuICAgIHZhciB0cmFja0RhdGEgPSB7XG4gICAgICAgIGZpbGVOdW1iZXI6IDAsXG4gICAgICAgIHJlcXVlc3RTaXplOiAwXG4gICAgfTtcblxuICAgIHZhciBzZWxmICAgICAgICAgPSB0aGlzO1xuICAgIHZhciBkcm9wQm94ICAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZHJvcGJveCcpO1xuICAgIHZhciBmaWxlVmlldyAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfbGlzdCcpO1xuICAgIHZhciBmaWxlSW5wdXRzICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZmlsZWlucHV0cycpO1xuICAgIHZhciBmb3JtICAgICAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZm9ybScpO1xuICAgIHZhciBlcnJvcldyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgc2VsZWN0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFt0aW1lb3V0IHNwZWNpZmllcyBob3cgbG9uZyB0aGUgZXJyb3IgbWVzc2FnZXMgYXJlIGRpc3BsYXllZF1cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yTWVzc2FnZVRpbWVvdXQ6IDUwMDAsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFt0aGUgbWF4aW11bSBmaWxlc2l6ZSBvZiBlYWNoIGZpbGUgaW4gYnl0ZXNdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlU2l6ZTogMzE0NTcyOCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW21heEZpbGVOdW1iZXIgZGVmaW5lcyBob3cgbWFueSBmaWxlcyBhcmUgYWxsb3dlZCB0byB1cGxvYWQgd2l0aCBlYWNoIHJlcXVlc3RdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlTnVtYmVyOiAzLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbU2l6ZSBvZiB0aHVtYm5haWxzIGRpc3BsYXllZCBpbiB0aGUgYnJvd3NlciBmb3IgcHJldmlldyB0aGUgaW1hZ2VzXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGh1bWJuYWlsU2l6ZTogMTAwLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZGVmaW5lcyB0aGUgbWF4aW11bSBzaXplIG9mIGVhY2ggcmVxdWVzdCBpbiBieXRlc11cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heFJlcXVlc3RTaXplOiA5NDM3MTg0LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbSWYgdHJ1ZSB0aGUgZmFsbGJhY2sgZm9yIElFOCBpcyBhY3RpdmF0ZWRdXG4gICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZmFsbGJhY2tGb3JJRTg6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtSZWd1bGFyIEV4cHJlc3Npb24gZm9yIGZpbGVuYW1lIG1hdGNoaW5nXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZmlsZU5hbWVSZTogL15bQS1aYS16MC05LlxcLV8gXSskLyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgZmlsZSBoYXMgY2hhcmFjdGVycyB3aGljaCBhcmUgbm90IGFsbG93ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpbnZhbGlkRmlsZU5hbWVFcnJvcjogJ1RoZSBuYW1lIG9mIHRoZSBmaWxlIGhhcyBmb3JiaWRkZW4gY2hhcmFjdGVycycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIGZpbGV0eXBlIGlzIG5vdCBhbGxvd2VkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaW52YWxpZEZpbGVUeXBlRXJyb3I6ICdUaGUgZmlsZWZvcm1hdCBpcyBub3QgYWxsb3dlZCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gcmVxdWVzdHNpemUgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heFJlcXVlc3RTaXplRXJyb3I6ICdUaGUgcmVxdWVzdHNpemUgb2YgdGhlIGZpbGVzIHlvdSB3YW50IHRvIHVwbG9hZCBpcyBleGNlZWRlZC4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBtYXguIGZpbGVudW1iZXIgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVOdW1iZXJFcnJvcjogJ1lvdSBjYW4gdXBsb2FkIDMgZmlsZXMsIG5vdCBtb3JlIScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gZmlsZW5zaXplIGlzIHJlYWNoZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlU2l6ZUVycm9yOiAnT25lIG9mIHRoZSBmaWxlcyBpcyB0b28gbGFyZ2UuIHRoZSBtYXhpbXVtIGZpbGVzaXplIGlzIDMgTUIuJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW0lmIHNvbWV0aGluZyBkdXJpbmcgdGhlIGZpbGVyZWFkaW5nIHByb2Nlc3Mgd2VudCB3cm9uZywgdGhlbiB0aGlzIG1lc3NhZ2UgaXMgZGlzcGxheWVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdW5rbm93bkZpbGVSZWFkZXJFcnJvcjogJ1Vua25vd24gRXJyb3Igd2hpbGUgbG9hZGluZyB0aGUgZmlsZS4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbT2JqZWN0cyBjb250YWlucyBhbGwgYWxsb3dlZCBtaW1ldHlwZXMgYXMga2V5cyAmIHRoZSBwcmV0dGlmaWVkIGZpbGVuYW1lcyBhcyB2YWx1ZXNdXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NlcHRlZFR5cGVzOiB7XG4gICAgICAgICAgICAnaW1hZ2UvcG5nJzogJ1BORy1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS9qcGVnJzogJ0pQRUctQmlsZCcsXG4gICAgICAgICAgICAnaW1hZ2UvZ2lmJzogJ0dJRi1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS90aWZmJzogJ1RJRkYtQmlsZCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vcGRmJzogJ1BERi1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJzogJ0V4Y2VsLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCc6ICdFeGNlbC1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vbXN3b3JkJzogJ1dvcmQtRG9rdW1lbnQnLFxuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JzogJ1dvcmQtRG9rdW1lbnQnXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWVyZ2luZyB0aGUgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIHVzZXIgcGFzc2VkIG9wdGlvbnMgdG9nZXRoZXJcbiAgICAgKiBAdHlwZSB7W29iamVjdF19XG4gICAgICovXG4gICAgdmFyIG9wdGlvbnMgPSBtZXJnZU9wdGlvbnMob3B0cywgZGVmYXVsdE9wdGlvbnMsIHNlbGYpO1xuXG4gICAgLyoqXG4gICAgICogW2luY3JlbWVudCB0aGUgZmlsZW51bWJlciBmb3IgZWFjaCBkcm9wcGVkIGZpbGUgYnkgb25lICYgaW5jcmVtZW50IHRoZSByZXF1ZXN0c2l6ZSBieSB0aGUgY3VycmVudCBmaWxlc2l6ZV1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZVxuICAgICAqIEBwYXJhbSAge1tvYmplY3RdfSB0cmFja0RhdGFcbiAgICAgKi9cbiAgICB2YXIgdHJhY2tGaWxlID0gZnVuY3Rpb24gKGZpbGUsIHRyYWNrRGF0YSkge1xuICAgICAgICB0cmFja0RhdGEuZmlsZU51bWJlciArPSAxO1xuICAgICAgICB0cmFja0RhdGEucmVxdWVzdFNpemUgKz0gZmlsZS5zaXplO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbZGVjcmVtZW50IHRoZSBmaWxlbnVtYmVyIGZvciBlYWNoIGRlbGV0ZWQgZmlsZSBieSBvbmUgJiBkZWNyZW1lbnQgdGhlIHJlcXVlc3RzaXplIGJ5IHRoZSBjdXJyZW50IGZpbGVzaXplXVxuICAgICAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlXG4gICAgICogQHBhcmFtICB7W29iamVjdF19IHRyYWNrRGF0YVxuICAgICAqL1xuICAgIHZhciB1bnRyYWNrRmlsZSA9IGZ1bmN0aW9uIChmaWxlLCB0cmFja0RhdGEpIHtcbiAgICAgICAgdHJhY2tEYXRhLmZpbGVOdW1iZXIgLT0gMTtcbiAgICAgICAgdHJhY2tEYXRhLnJlcXVlc3RTaXplIC09IGZpbGUuc2l6ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW0NyZWF0ZXMgYSBoaWRkZW4gaW5wdXQgZmllbGQgd2hlcmUgdGhlIGJhc2U2NCBkYXRhIGlzIHN0b3JlZF1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZU9iaiBbdGhlIGJhc2U2NCBzdHJpbmcgJiBhbGwgbWV0YWRhdGEgY29tYmluZWQgaW4gb25lIG9iamVjdF1cbiAgICAgKi9cbiAgICB2YXIgYWRkQmFzZTY0VG9Eb20gPSBmdW5jdGlvbiAoZmlsZU9iaiwgZm9ybSkge1xuICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuXG4gICAgICAgIGlucHV0LnR5cGUgPSAnaGlkZGVuJztcbiAgICAgICAgaW5wdXQudmFsdWUgPSBmaWxlT2JqLmRhdGE7XG4gICAgICAgIGlucHV0Lm5hbWUgPSAnZmlsZTonICsgZmlsZU9iai5maWxlLm5hbWU7XG5cbiAgICAgICAgZm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlucHV0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaW5wdXQpO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbQ3JlYXRlcyBhIGxpc3QgaXRlbSB3aGljaCBnZXRzIGluamVjdGVkIHRvIHRoZSBET01dXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZmlsZU9iaiAgICAgICAgICAgICBbZmlsZWRhdGEgZm9yIGFkZGluZyB0aGUgZmlsZWRhdGEgJiBwcmV2aWV3IHRvIHRoZSBET01dXG4gICAgICogQHBhcmFtIHtbZnVuY3Rpb25dfSByZW1vdmVGaWxlSGFuZGxlciBbY2FsbGJhY2sgZm9yIG5vdGlmeWluZyB0aGF0IHRoZSBzcGVjaWZpZWQgZmlsZSB3YXMgZGVsZXRlZF1cbiAgICAgKi9cbiAgICB2YXIgYWRkRmlsZVRvVmlldyA9IGZ1bmN0aW9uIChmaWxlT2JqLCByZW1vdmVGaWxlSGFuZGxlckNhbGxiYWNrLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCkge1xuICAgICAgICB2YXIgcmVtb3ZlQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgICAgIHJlbW92ZUJ1dHRvbi5jbGFzc05hbWUgPSAncmVtb3ZlJztcbiAgICAgICAgbGlzdEVsZW1lbnQuYXBwZW5kQ2hpbGQocmVtb3ZlQnV0dG9uKTtcblxuICAgICAgICBmaWxlVmlldy5hcHBlbmRDaGlsZChsaXN0RWxlbWVudCk7XG5cbiAgICAgICAgcmVtb3ZlQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gY2FsbHMgdGhlIGNhbGxiYWNrIG9mIHRoZSBETkQgSGFuZGxlclxuICAgICAgICAgICAgcmVtb3ZlRmlsZUhhbmRsZXJDYWxsYmFjayh0cmFja0RhdGEpO1xuXG4gICAgICAgICAgICAvLyByZW1vdmUgZmlsZVZpZXdFbGVtZW50XG4gICAgICAgICAgICBsaXN0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpc3RFbGVtZW50KTtcblxuICAgICAgICAgICAgdW50cmFja0ZpbGUoZmlsZU9iai5maWxlLCB0cmFja0RhdGEpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2lmIHBvc3NpYmxlIGFkZHMgYSB0aHVtYm5haWwgb2YgdGhlIGdpdmVuIGZpbGUgdG8gdGhlIERPTV1cbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSAgICAgZmlsZSAgICBbZmlsZWRhdGEgdG8gY3JlYXRlIGEgdGh1bWJuYWlsIHdoaWNoIGdldHMgaW5qZWN0ZWRdXG4gICAgICogQHBhcmFtIHtbRE9NIG9iamVjdF19IGVsZW1lbnQgW0RPTSBlbGVtZW50IHRvIHNwZWNpZnkgd2hlcmUgdGhlIHRodW1ibmFpbCBoYXMgdG8gYmUgaW5qZWN0ZWRdXG4gICAgICovXG4gICAgdmFyIGFkZFRodW1ibmFpbCA9IGZ1bmN0aW9uIChmaWxlLCBlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBpc0ltYWdlID0gcmVxdWlyZSgnLi91dGlscy9pcy1pbWFnZS5qcycpO1xuXG4gICAgICAgIHZhciBFTVBUWV9JTUFHRSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJBUU1BQUFBbDIxYktBQUFBQTFCTVZFVUFBQUNuZWozYUFBQUFBWFJTVGxNQVFPYllaZ0FBQUFwSlJFRlVDTmRqWUFBQUFBSUFBZUlodkRNQUFBQUFTVVZPUks1Q1lJST0nO1xuXG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgZmFjdG9yID0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIHZhciBpbWdXcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuXG4gICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcblxuICAgICAgICBjYW52YXMud2lkdGggID0gb3B0aW9ucy50aHVtYm5haWxTaXplICogZmFjdG9yO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gb3B0aW9ucy50aHVtYm5haWxTaXplICogZmFjdG9yO1xuXG4gICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICBpZiAoZmFjdG9yID4gMSkge1xuICAgICAgICAgICAgY3R4LndlYmtpdEJhY2tpbmdTdG9yZVBpeGVsUmF0aW8gPSBmYWN0b3I7XG4gICAgICAgICAgICBjdHguc2NhbGUoZmFjdG9yLCBmYWN0b3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbGVOYW1lID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuanNfbmFtZScpO1xuICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1nV3JhcHBlci5jbGFzc05hbWUgPSAndGh1bWJuYWlsJztcblxuICAgICAgICBpbWFnZS5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJhdGlvID0gdGhpcy5oZWlnaHQgLyB0aGlzLndpZHRoO1xuXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLndpZHRoICogcmF0aW87XG4gICAgICAgICAgICBjdHguZHJhd0ltYWdlKHRoaXMsIDAsIDAsIG9wdGlvbnMudGh1bWJuYWlsU2l6ZSAqIGZhY3Rvciwgb3B0aW9ucy50aHVtYm5haWxTaXplICogcmF0aW8gKiBmYWN0b3IpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGlzSW1hZ2UoZmlsZSkpIHtcbiAgICAgICAgICAgICAgICBpbWFnZS5zcmMgPSBldmVudC50YXJnZXQucmVzdWx0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbWFnZS5zcmMgPSBFTVBUWV9JTUFHRTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW1nV3JhcHBlci5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgICAgICAgICAgZWxlbWVudC5pbnNlcnRCZWZvcmUoaW1nV3JhcHBlciwgZmlsZU5hbWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTChmaWxlKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW0NyZWF0ZXMgYSBsaXN0RWxlbWVudCB3aXRoIHRoZSBkYXRhIG9mIHRoZSBwYXNzZWQgb2JqZWN0XVxuICAgICAqIEBwYXJhbSAge1t0eXBlXX0gZmlsZU9iaiBbdXNlZCB0byBwdXQgdGhlIGluZm9ybWF0aW9uIG9mIHRoZSBmaWxlIGluIHRoZSBsaXN0RWxlbWVtdF1cbiAgICAgKiBAcmV0dXJuIHtbb2JqZWN0XX0gICAgICAgW3RoZSBsaXN0RWxlbWVudCB3aGljaCBnZXRzIGluamVjdGVkIGluIHRoZSBET01dXG4gICAgICovXG4gICAgdmFyIGNyZWF0ZUxpc3RFbGVtZW50ID0gZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlU2l6ZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgdmFyIGZpbGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgZmlsZUVsZW1lbnQuY2xhc3NOYW1lID0gJ2ZpbGUnO1xuXG4gICAgICAgIGZpbGVFbGVtZW50LmlubmVySFRNTCA9IFtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwganNfbmFtZSBuYW1lXCI+JyxcbiAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJsYWJlbCBzaXplXCI+JyxcbiAgICAgICAgZmlsZVNpemUsXG4gICAgICAgICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJsYWJlbCB0eXBlXCI+JyxcbiAgICAgICAgZmlsZVR5cGUsXG4gICAgICAgICc8L3NwYW4+JyBdLmpvaW4oJycpO1xuXG4gICAgICAgIHJldHVybiBmaWxlRWxlbWVudDtcbiAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAqIFtyZXR1cm5zIHRoZSBwcmV0dGlmaWVkIGZpbGVzdHlwZSBzdHJpbmcgYmFzZWQgb24gdGhlIHNwZWNpZmllZCBvcHRpb25zXVxuICAgICAqIEBwYXJhbSAge1tzdHJpbmddfSBmaWxlVHlwZSBbbWltZXR5cGUgb2YgZmlsZV1cbiAgICAgKiBAcmV0dXJuIHtbc3RyaW5nXX0gICAgICBbcHJldHRpZmllZCB0eXBlc3RyaW5nXVxuICAgICAqL1xuICAgIHZhciBnZXRSZWFkYWJsZUZpbGVUeXBlID0gZnVuY3Rpb24gKGZpbGVUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdIHx8ICd1bmtub3duIGZpbGV0eXBlJztcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZU51bWJlciA9IGZ1bmN0aW9uICh0cmFja0RhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHRyYWNrRGF0YS5maWxlTnVtYmVyID49IG9wdGlvbnMubWF4RmlsZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZVJlcXVlc3RTaXplID0gZnVuY3Rpb24gKHJlcXVlc3RTaXplLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0U2l6ZSA+PSBvcHRpb25zLm1heFJlcXVlc3RTaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZVR5cGUgPSBmdW5jdGlvbiAoZmlsZVR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZVNpemUgPSBmdW5jdGlvbiAoZmlsZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAoZmlsZS5zaXplID4gb3B0aW9ucy5tYXhGaWxlU2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGVOYW1lID0gZnVuY3Rpb24gKGZpbGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCEob3B0aW9ucy5maWxlTmFtZVJlKS50ZXN0KGZpbGUubmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbZGlzcGxheXMgdGhlIEVycm9yIG1lc3NhZ2UgJiByZW1vdmVzIGl0IGFsc28gYWZ0ZXIgdGhlIHNwZWNpZmllZCB0aW1lb3V0XVxuICAgICAqIEBwYXJhbSAge1tzdHJpbmddfSBlcnJvciBbZXJyb3IgbWVzc2FnZSB3aGljaCBoYXMgdG8gYmUgZGlzcGxheWVkXVxuICAgICAqL1xuICAgIHZhciBzaG93RXJyb3JNZXNzYWdlID0gZnVuY3Rpb24gKGVycm9yLCBlcnJvclRpbWVvdXRJZCwgcmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBlcnJvckVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgICAgIGVycm9yRWxlbWVudC5jbGFzc05hbWUgPSAnZXJyb3InO1xuICAgICAgICBlcnJvckVsZW1lbnQuaW5uZXJIVE1MID0gZXJyb3I7XG5cbiAgICAgICAgY2xlYXJUaW1lb3V0KGVycm9yVGltZW91dElkKTtcblxuICAgICAgICBlcnJvclRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVtb3ZlRXJyb3JzKGVycm9yV3JhcHBlcik7XG4gICAgICAgIH0sIG9wdGlvbnMuZXJyb3JNZXNzYWdlVGltZW91dCk7XG5cbiAgICAgICAgZXJyb3JXcmFwcGVyLmFwcGVuZENoaWxkKGVycm9yRWxlbWVudCk7XG4gICAgICAgIGZvcm0uaW5zZXJ0QmVmb3JlKGVycm9yV3JhcHBlciwgZmlsZVZpZXcpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbcmVtb3ZlcyBhbGwgZXJyb3JzXVxuICAgICAqL1xuICAgIHZhciByZW1vdmVFcnJvcnMgPSBmdW5jdGlvbiAoZXJyb3JXcmFwcGVyKSB7XG4gICAgICAgIGVycm9yV3JhcHBlci5pbm5lckhUTUwgPSAnJztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgdGhlIGFzeW5jIGZpbGVyZWFkZXIgcmVzcG9uc2VcbiAgICAgKiBAcGFyYW0gIHtbc3RyaW5nXX0gZXJyICAgICBbdGhlIGVycm9ybWVzc2FnZSB3aGljaCBnZXRzIHRocm93biB3aGVuIHRoZSBmaWxlcmVhZGVyIGVycm9yZWRdXG4gICAgICogQHBhcmFtICB7W29iamVjdF19IGZpbGVPYmogW3RoZSBiYXNlNjQgc3RyaW5nICYgYWxsIG1ldGFkYXRhIGNvbWJpbmVkIGluIG9uZSBvYmplY3RdXG4gICAgICovXG4gICAgdmFyIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlciA9IGZ1bmN0aW9uIChlcnIsIGZpbGVPYmopIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWxlT2JqKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlSGFuZGxlciA9IGFkZEJhc2U2NFRvRG9tKGZpbGVPYmosIGZvcm0pO1xuICAgICAgICAgICAgdmFyIGZpbGVUeXBlID0gZ2V0UmVhZGFibGVGaWxlVHlwZShnZXRGaWxlVHlwZShmaWxlT2JqLmZpbGUpLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBsaXN0RWxlbWVudCA9IGNyZWF0ZUxpc3RFbGVtZW50KGZpbGVPYmouZmlsZS5uYW1lLCBnZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSksIGZpbGVUeXBlKTtcbiAgICAgICAgICAgIGFkZEZpbGVUb1ZpZXcoZmlsZU9iaiwgcmVtb3ZlSGFuZGxlciwgdHJhY2tEYXRhLCBmaWxlVmlldywgbGlzdEVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAoaGFzRmlsZVJlYWRlcigpKSB7XG4gICAgICAgICAgICAgICAgYWRkVGh1bWJuYWlsKGZpbGVPYmouZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICBpZiAoIXZhbGlkYXRlRmlsZU51bWJlcih0cmFja0RhdGEsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlTnVtYmVyRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZhbGlkYXRlUmVxdWVzdFNpemUodHJhY2tEYXRhLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubWF4UmVxdWVzdFNpemVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdmFsaWRhdGVGaWxlVHlwZShnZXRGaWxlVHlwZShmaWxlKSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmludmFsaWRGaWxlVHlwZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWxpZGF0ZUZpbGVTaXplKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlU2l6ZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWxpZGF0ZUZpbGVOYW1lKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZhbGlkRmlsZU5hbWVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbY29udmVydHMgdGhlIGZpbGVkYXRhIGludG8gYSBiYXNlNjQgc3RyaW5nIGFuZCB2YWxpZGF0ZXMgdGhlIGZpbGVkYXRhXVxuICAgICAqIEBwYXJhbSAge1thcnJheV19ICBmaWxlcyAgW3RoZSBjb252ZXJ0ZWQgZmlsZUxpc3RPYmplY3RdXG4gICAgICovXG4gICAgdGhpcy5jb252ZXJ0RmlsZXNUb0Jhc2U2NCA9IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICBmaWxlcy5ldmVyeShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsaWRhdGVGaWxlKGZpbGUpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UodmFsaWRhdGVGaWxlKGZpbGUpLCBlcnJvclRpbWVvdXRJZCwgcmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuXG4gICAgICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlcihudWxsLCB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGV2ZW50LnRhcmdldC5yZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29udmVydEJhc2U2NEZpbGVIYW5kbGVyKG9wdGlvbnMudW5rbm93bkZpbGVSZWFkZXJFcnJvcik7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoZmlsZSk7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW0FkZCBhIGZpbGVJbnB1dCB3aXRoIHRoZSBzZWxlY3RlZCBmaWxlIHRvIGZvcm1dXG4gICAgICovXG4gICAgdGhpcy5hZGRTZWxlY3RlZEZpbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmaWxlSW5wdXQgPSBjcmVhdGVGaWxlSW5wdXQoZmlsZUlucHV0SWQpO1xuXG4gICAgICAgIGZvcm0uaW5zZXJ0QmVmb3JlKHNlbGVjdEJ1dHRvbiwgZHJvcEJveCk7XG4gICAgICAgIHNlbGVjdEJ1dHRvbi5hcHBlbmRDaGlsZChmaWxlSW5wdXQpO1xuXG4gICAgICAgIGZpbGVJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZW1vdmVFcnJvcnMoZXJyb3JXcmFwcGVyKTtcblxuICAgICAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmZpbGVzWzBdO1xuXG4gICAgICAgICAgICB2YXIgZmlsZU9iaiA9IHtcbiAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuICAgICAgICAgICAgICAgIGZpbGVJbnB1dC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGZpbGVJbnB1dCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbGlkYXRlRmlsZShmaWxlKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBzaG93RXJyb3JNZXNzYWdlKHZhbGlkYXRlRmlsZShmaWxlKSwgb3B0aW9ucy5lcnJvclRpbWVvdXRJZCwgcmVtb3ZlRXJyb3JzLCBlcnJvcldyYXBwZXIsIGZvcm0sIGZpbGVWaWV3LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICBmaWxlSW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSBnZXRSZWFkYWJsZUZpbGVUeXBlKGdldEZpbGVUeXBlKGZpbGUpLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdEVsZW1lbnQgPSBjcmVhdGVMaXN0RWxlbWVudChmaWxlLm5hbWUsIGZpbGVUeXBlLCBnZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSkpO1xuXG4gICAgICAgICAgICAgICAgdHJhY2tGaWxlKGZpbGUsIHRyYWNrRGF0YSk7XG4gICAgICAgICAgICAgICAgYWRkRmlsZVRvVmlldyhmaWxlT2JqLCByZW1vdmVIYW5kbGVyLCB0cmFja0RhdGEsIGZpbGVWaWV3LCBsaXN0RWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGFzRmlsZVJlYWRlcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZFRodW1ibmFpbChmaWxlLCBsaXN0RWxlbWVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmlsZUlucHV0cy5hcHBlbmRDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxmLmFkZFNlbGVjdGVkRmlsZSgpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogZHJvcGhhbmRsZXIgY2FsbHMgdGhlIGRuZEhhbmRsZXIgYWx3YXlzIHdoZW5uIGEgZmlsZSBnZXRzIGRyb3BwZWRcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcm9wJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIG5vUHJvcGFnYXRpb24oZXZlbnQpO1xuXG4gICAgICAgIHZhciBmaWxlcyA9IHRvQXJyYXkoZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzKTtcblxuICAgICAgICBzZWxmLmNvbnZlcnRGaWxlc1RvQmFzZTY0KGZpbGVzKTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnZW50ZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuICAgIGRyb3BCb3guYWRkRXZlbnRMaXN0ZW5lcignZHJhZ292ZXInLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgb3RoZXIgZXZlbnRzIGFyZSBhbHNvIGhhbmRsZWQgY2F1c2UgdGhleSBoYXZlIHRvIGJlXG4gICAgICogQHBhcmFtIHtbb2JqZWN0XX0gZXZlbnQgW2Ryb3BFdmVudCB3aGVyZSB0aGUgZmlsZWxpc3QgaXMgYmluZGVkXVxuICAgICAqL1xuXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnbGVhdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LnRvZ2dsZSgnYWN0aXZlJyk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGVyZSBpcyBubyBmaWxlcmVhZGVyIGF2YWlsYWJsZSwgdGhlbiB0aGUgZHJvcHpvbmUgc2hvdWxkIG5vdCBiZSBkaXNwbGF5ZWQgYW5kIHRoZSBGYWxsYmFjayBpcyBkaXNwbGF5ZWRcbiAgICAgKi9cbiAgICBpZiAoIWhhc0ZpbGVSZWFkZXIoKSAmJiBvcHRpb25zLmZhbGxiYWNrRm9ySUU4KSB7XG4gICAgICAgIHNlbGVjdEJ1dHRvbi5jbGFzc05hbWUgPSAnc2VsZWN0YnV0dG9uIGpzX3NlbGVjdGJ1dHRvbic7XG5cbiAgICAgICAgdmFyIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAgICAgc3Bhbi5pbm5lckhUTUwgPSAnU2VsZWN0IEZpbGUnO1xuXG4gICAgICAgIHNlbGVjdEJ1dHRvbi5hcHBlbmRDaGlsZChzcGFuKTtcblxuICAgICAgICBzZWxmLmFkZFNlbGVjdGVkRmlsZSgpO1xuXG4gICAgICAgIGRyb3BCb3guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZvcm1GaWxlVXBsb2FkO1xuXG4vKiBnbG9iYWxzICQsIEZvcm1GaWxlVXBsb2FkICovXG5cbiQuZm4uZm9ybUZpbGVVcGxvYWQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5zdGFuY2VPcHRpb25zO1xuXG4gICAgICAgIGlmICghJC5kYXRhKHRoaXMsICdmb3JtRmlsZVVwbG9hZCcpKSB7XG4gICAgICAgICAgICBpbnN0YW5jZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucywgJCh0aGlzKS5kYXRhKCkpO1xuICAgICAgICAgICAgJC5kYXRhKHRoaXMsICdmb3JtRmlsZVVwbG9hZCcsIG5ldyBGb3JtRmlsZVVwbG9hZCh0aGlzLCBpbnN0YW5jZU9wdGlvbnMpKTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcbiIsIi8qKlxuICogW2NyZWF0ZUlucHV0RWxlbWVudCBkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgY3JlYXRlRmlsZUlucHV0ID0gZnVuY3Rpb24gKGZpbGVJbnB1dElkKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIGZpbGVJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICBmaWxlSW5wdXQudHlwZSA9ICdmaWxlJztcbiAgICBmaWxlSW5wdXQuY2xhc3NOYW1lID0gJ2ZpbGVpbnB1dCc7XG4gICAgZmlsZUlucHV0SWQgKz0gMTtcblxuICAgIGZpbGVJbnB1dC5uYW1lID0gJ2ZpbGVJbnB1dCAnICsgZmlsZUlucHV0SWQ7XG5cbiAgICByZXR1cm4gZmlsZUlucHV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVGaWxlSW5wdXQ7XG4iLCIvKipcbiAqIFJldHVybnMgdGhlIEZpbGV0eXBlXG4gKiBAcGFyYW0gIHtbdHlwZV19IG5hdGl2ZUZpbGUgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGdldEZpbGVUeXBlID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBGaXggY2hyb21pdW0gaXNzdWUgMTA1MzgyOiBFeGNlbCAoLnhscykgRmlsZVJlYWRlciBtaW1lIHR5cGUgaXMgZW1wdHkuXG4gICAgaWYgKCgvXFwueGxzJC8pLnRlc3QoZmlsZS5uYW1lKSAmJiAhZmlsZS50eXBlKSB7XG4gICAgICAgIHJldHVybiAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJztcbiAgICB9XG4gICAgcmV0dXJuIGZpbGUudHlwZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0RmlsZVR5cGU7XG4iLCIvKipcbiAqIFRha2VzIHRoZSBuYXRpdmUgZmlsZXNpemUgaW4gYnl0ZXMgYW5kIHJldHVybnMgdGhlIHByZXR0aWZpZWQgZmlsZXNpemVcbiAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlIFtjb250YWlucyB0aGUgc2l6ZSBvZiB0aGUgZmlsZV1cbiAqIEByZXR1cm4ge1tzdHJpbmddfSAgICAgIFtwcmV0dGlmaWVkIGZpbGVzaXplXVxuICovXG52YXIgZ2V0UmVhZGFibGVGaWxlU2l6ZSA9IGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHNpemUgPSBmaWxlLnNpemU7XG4gICAgdmFyIHN0cmluZztcblxuICAgIGlmIChzaXplID49IDEwMjQgKiAxMDI0ICogMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ1RCJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQgKiAxMDI0KSB7XG4gICAgICAgIHNpemUgPSBzaXplIC8gKDEwMjQgKiAxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ0dCJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgLyAxMCk7XG4gICAgICAgIHN0cmluZyA9ICdNQic7XG4gICAgfSBlbHNlIGlmIChzaXplID49IDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ0tCJztcbiAgICB9IGVsc2Uge1xuICAgICAgICBzaXplID0gc2l6ZSAqIDEwO1xuICAgICAgICBzdHJpbmcgPSAnQic7XG4gICAgfVxuXG4gICAgcmV0dXJuIChNYXRoLnJvdW5kKHNpemUpIC8gMTApICsgJyAnICsgc3RyaW5nO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRSZWFkYWJsZUZpbGVTaXplO1xuIiwiLyoqXG4gKiBbaGFzRmlsZVJlYWRlciBkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59IFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGhhc0ZpbGVSZWFkZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuICEhKHdpbmRvdy5GaWxlICYmIHdpbmRvdy5GaWxlTGlzdCAmJiB3aW5kb3cuRmlsZVJlYWRlcik7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGhhc0ZpbGVSZWFkZXI7XG4iLCJ2YXIgZ2V0RmlsZVR5cGUgPSByZXF1aXJlKCcuL2dldC1maWxlLXR5cGUuanMnKVxuXG4vKipcbiAqIFtpc0ltYWdlIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSAgZmlsZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGlzSW1hZ2UgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiAoL15pbWFnZVxcLy8pLnRlc3QoZ2V0RmlsZVR5cGUoZmlsZSkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0ltYWdlO1xuIiwiLyoqXG4gKiBbbWVyZ2VPcHRpb25zIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBvcHRzICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IGRlZmF1bHRvcHRpb25zIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgbWVyZ2VPcHRpb25zID0gZnVuY3Rpb24gKG9wdHMsIGRlZmF1bHRPcHRpb25zLCBzZWxmKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7fTtcblxuICAgIGZvciAodmFyIGkgaW4gZGVmYXVsdE9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgb3B0aW9uc1tpXSA9IG9wdHNbaV07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKG9wdGlvbnNbaV0pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1tpXSA9IG9wdGlvbnNbaV0uYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbnNbaV0gPSBkZWZhdWx0T3B0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3B0aW9ucztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbWVyZ2VPcHRpb25zO1xuIiwiLyoqXG4gKiBbbm9Qcm9wYWdhdGlvbiBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgbm9Qcm9wYWdhdGlvbiA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIHJldHVybiBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vUHJvcGFnYXRpb247XG4iLCIvKipcbiAqIFt0b0FycmF5IGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBvYmplY3QgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgdG9BcnJheSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqZWN0LCAwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdG9BcnJheTtcbiJdfQ==
