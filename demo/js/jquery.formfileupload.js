(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* globals window, document, FileReader, Image */

var mergeOptions        = require('./utils/merge-options.js');
var getFileType         = require('./utils/get-file-type.js');
var getReadableFileSize = require('./utils/get-readable-file-size.js');
var hasFileReader       = require('./utils/has-filereader.js');
var createFileInput     = require('./utils/create-file-input.js');
var noPropagation       = require('./utils/no-propagation.js');
var toArray             = require('./utils/to-array.js');
var isImage             = require('./utils/is-image.js');

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
    var trackFile = function (file) {
        trackData.fileNumber += 1;
        trackData.requestSize += file.size;
    };

    /**
     * [decrement the filenumber for each deleted file by one & decrement the requestsize by the current filesize]
     * @param  {[object]} file
     * @param  {[object]} trackData
     */
    var untrackFile = function (file) {
        trackData.fileNumber -= 1;
        trackData.requestSize -= file.size;
    };

    /**
     * [Creates a hidden input field where the base64 data is stored]
     * @param  {[object]} fileObj [the base64 string & all metadata combined in one object]
     */
    var addBase64ToDom = function (fileObj) {
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
        var EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';
        var factor      = window.devicePixelRatio;
        var imgWrapper  = document.createElement('span');
        var reader      = new FileReader();

        var ctx = canvas.getContext('2d');

        canvas.width  = options.thumbnailSize * factor;
        canvas.height = options.thumbnailSize * factor;

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
                var fileType = getReadableFileType(getFileType(file), options);
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
var getFileType = require('./get-file-type.js');

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvZmFrZV9kNWRiMTA5NC5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2NyZWF0ZS1maWxlLWlucHV0LmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvZ2V0LWZpbGUtdHlwZS5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2dldC1yZWFkYWJsZS1maWxlLXNpemUuanMiLCIvVXNlcnMvbWF4aGVpL3JlcG9zaXRvcmllcy9Gb3JtLUZpbGUtVXBsb2FkL3NyYy9qcy91dGlscy9oYXMtZmlsZXJlYWRlci5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL2lzLWltYWdlLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvbWVyZ2Utb3B0aW9ucy5qcyIsIi9Vc2Vycy9tYXhoZWkvcmVwb3NpdG9yaWVzL0Zvcm0tRmlsZS1VcGxvYWQvc3JjL2pzL3V0aWxzL25vLXByb3BhZ2F0aW9uLmpzIiwiL1VzZXJzL21heGhlaS9yZXBvc2l0b3JpZXMvRm9ybS1GaWxlLVVwbG9hZC9zcmMvanMvdXRpbHMvdG8tYXJyYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFscyB3aW5kb3csIGRvY3VtZW50LCBGaWxlUmVhZGVyLCBJbWFnZSAqL1xuXG52YXIgbWVyZ2VPcHRpb25zICAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvbWVyZ2Utb3B0aW9ucy5qcycpO1xudmFyIGdldEZpbGVUeXBlICAgICAgICAgPSByZXF1aXJlKCcuL3V0aWxzL2dldC1maWxlLXR5cGUuanMnKTtcbnZhciBnZXRSZWFkYWJsZUZpbGVTaXplID0gcmVxdWlyZSgnLi91dGlscy9nZXQtcmVhZGFibGUtZmlsZS1zaXplLmpzJyk7XG52YXIgaGFzRmlsZVJlYWRlciAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvaGFzLWZpbGVyZWFkZXIuanMnKTtcbnZhciBjcmVhdGVGaWxlSW5wdXQgICAgID0gcmVxdWlyZSgnLi91dGlscy9jcmVhdGUtZmlsZS1pbnB1dC5qcycpO1xudmFyIG5vUHJvcGFnYXRpb24gICAgICAgPSByZXF1aXJlKCcuL3V0aWxzL25vLXByb3BhZ2F0aW9uLmpzJyk7XG52YXIgdG9BcnJheSAgICAgICAgICAgICA9IHJlcXVpcmUoJy4vdXRpbHMvdG8tYXJyYXkuanMnKTtcbnZhciBpc0ltYWdlICAgICAgICAgICAgID0gcmVxdWlyZSgnLi91dGlscy9pcy1pbWFnZS5qcycpO1xuXG52YXIgRm9ybUZpbGVVcGxvYWQgPSBmdW5jdGlvbiAoZmlsZVVwbG9hZF8sIG9wdHMpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZXJyb3JUaW1lb3V0SWQ7XG4gICAgdmFyIGZpbGVJbnB1dElkID0gMDtcblxuICAgIHZhciB0cmFja0RhdGEgPSB7XG4gICAgICAgIGZpbGVOdW1iZXI6IDAsXG4gICAgICAgIHJlcXVlc3RTaXplOiAwXG4gICAgfTtcblxuICAgIHZhciBzZWxmICAgICAgICAgPSB0aGlzO1xuICAgIHZhciBkcm9wQm94ICAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZHJvcGJveCcpO1xuICAgIHZhciBmaWxlVmlldyAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfbGlzdCcpO1xuICAgIHZhciBmaWxlSW5wdXRzICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZmlsZWlucHV0cycpO1xuICAgIHZhciBmb3JtICAgICAgICAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanNfZm9ybScpO1xuICAgIHZhciBlcnJvcldyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICB2YXIgc2VsZWN0QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFt0aW1lb3V0IHNwZWNpZmllcyBob3cgbG9uZyB0aGUgZXJyb3IgbWVzc2FnZXMgYXJlIGRpc3BsYXllZF1cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yTWVzc2FnZVRpbWVvdXQ6IDUwMDAsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFt0aGUgbWF4aW11bSBmaWxlc2l6ZSBvZiBlYWNoIGZpbGUgaW4gYnl0ZXNdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlU2l6ZTogMzE0NTcyOCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW21heEZpbGVOdW1iZXIgZGVmaW5lcyBob3cgbWFueSBmaWxlcyBhcmUgYWxsb3dlZCB0byB1cGxvYWQgd2l0aCBlYWNoIHJlcXVlc3RdXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlTnVtYmVyOiAzLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbU2l6ZSBvZiB0aHVtYm5haWxzIGRpc3BsYXllZCBpbiB0aGUgYnJvd3NlciBmb3IgcHJldmlldyB0aGUgaW1hZ2VzXVxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICAgKi9cbiAgICAgICAgdGh1bWJuYWlsU2l6ZTogMTAwLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZGVmaW5lcyB0aGUgbWF4aW11bSBzaXplIG9mIGVhY2ggcmVxdWVzdCBpbiBieXRlc11cbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICovXG4gICAgICAgIG1heFJlcXVlc3RTaXplOiA5NDM3MTg0LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbSWYgdHJ1ZSB0aGUgZmFsbGJhY2sgZm9yIElFOCBpcyBhY3RpdmF0ZWRdXG4gICAgICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZmFsbGJhY2tGb3JJRTg6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtSZWd1bGFyIEV4cHJlc3Npb24gZm9yIGZpbGVuYW1lIG1hdGNoaW5nXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZmlsZU5hbWVSZTogL15bQS1aYS16MC05LlxcLV8gXSskLyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW2Vycm9ybWVzc2FnZSBkaXNwbGF5ZWQgd2hlbiB0aGUgZmlsZSBoYXMgY2hhcmFjdGVycyB3aGljaCBhcmUgbm90IGFsbG93ZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpbnZhbGlkRmlsZU5hbWVFcnJvcjogJ1RoZSBuYW1lIG9mIHRoZSBmaWxlIGhhcyBmb3JiaWRkZW4gY2hhcmFjdGVycycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIGZpbGV0eXBlIGlzIG5vdCBhbGxvd2VkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaW52YWxpZEZpbGVUeXBlRXJyb3I6ICdUaGUgZmlsZWZvcm1hdCBpcyBub3QgYWxsb3dlZCcsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gcmVxdWVzdHNpemUgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heFJlcXVlc3RTaXplRXJyb3I6ICdUaGUgcmVxdWVzdHNpemUgb2YgdGhlIGZpbGVzIHlvdSB3YW50IHRvIHVwbG9hZCBpcyBleGNlZWRlZC4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbZXJyb3JtZXNzYWdlIGRpc3BsYXllZCB3aGVuIHRoZSBtYXguIGZpbGVudW1iZXIgaXMgcmVhY2hlZF1cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1heEZpbGVOdW1iZXJFcnJvcjogJ1lvdSBjYW4gdXBsb2FkIDMgZmlsZXMsIG5vdCBtb3JlIScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFtlcnJvcm1lc3NhZ2UgZGlzcGxheWVkIHdoZW4gdGhlIG1heC4gZmlsZW5zaXplIGlzIHJlYWNoZWRdXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBtYXhGaWxlU2l6ZUVycm9yOiAnT25lIG9mIHRoZSBmaWxlcyBpcyB0b28gbGFyZ2UuIHRoZSBtYXhpbXVtIGZpbGVzaXplIGlzIDMgTUIuJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogW0lmIHNvbWV0aGluZyBkdXJpbmcgdGhlIGZpbGVyZWFkaW5nIHByb2Nlc3Mgd2VudCB3cm9uZywgdGhlbiB0aGlzIG1lc3NhZ2UgaXMgZGlzcGxheWVkXVxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdW5rbm93bkZpbGVSZWFkZXJFcnJvcjogJ1Vua25vd24gRXJyb3Igd2hpbGUgbG9hZGluZyB0aGUgZmlsZS4nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBbT2JqZWN0cyBjb250YWlucyBhbGwgYWxsb3dlZCBtaW1ldHlwZXMgYXMga2V5cyAmIHRoZSBwcmV0dGlmaWVkIGZpbGVuYW1lcyBhcyB2YWx1ZXNdXG4gICAgICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NlcHRlZFR5cGVzOiB7XG4gICAgICAgICAgICAnaW1hZ2UvcG5nJzogJ1BORy1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS9qcGVnJzogJ0pQRUctQmlsZCcsXG4gICAgICAgICAgICAnaW1hZ2UvZ2lmJzogJ0dJRi1CaWxkJyxcbiAgICAgICAgICAgICdpbWFnZS90aWZmJzogJ1RJRkYtQmlsZCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vcGRmJzogJ1BERi1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJzogJ0V4Y2VsLURva3VtZW50JyxcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi92bmQub3BlbnhtbGZvcm1hdHMtb2ZmaWNlZG9jdW1lbnQuc3ByZWFkc2hlZXRtbC5zaGVldCc6ICdFeGNlbC1Eb2t1bWVudCcsXG4gICAgICAgICAgICAnYXBwbGljYXRpb24vbXN3b3JkJzogJ1dvcmQtRG9rdW1lbnQnLFxuICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JzogJ1dvcmQtRG9rdW1lbnQnXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogTWVyZ2luZyB0aGUgZGVmYXVsdCBvcHRpb25zIHdpdGggdGhlIHVzZXIgcGFzc2VkIG9wdGlvbnMgdG9nZXRoZXJcbiAgICAgKiBAdHlwZSB7W29iamVjdF19XG4gICAgICovXG4gICAgdmFyIG9wdGlvbnMgPSBtZXJnZU9wdGlvbnMob3B0cywgZGVmYXVsdE9wdGlvbnMsIHNlbGYpO1xuXG4gICAgLyoqXG4gICAgICogW2luY3JlbWVudCB0aGUgZmlsZW51bWJlciBmb3IgZWFjaCBkcm9wcGVkIGZpbGUgYnkgb25lICYgaW5jcmVtZW50IHRoZSByZXF1ZXN0c2l6ZSBieSB0aGUgY3VycmVudCBmaWxlc2l6ZV1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZVxuICAgICAqIEBwYXJhbSAge1tvYmplY3RdfSB0cmFja0RhdGFcbiAgICAgKi9cbiAgICB2YXIgdHJhY2tGaWxlID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgdHJhY2tEYXRhLmZpbGVOdW1iZXIgKz0gMTtcbiAgICAgICAgdHJhY2tEYXRhLnJlcXVlc3RTaXplICs9IGZpbGUuc2l6ZTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2RlY3JlbWVudCB0aGUgZmlsZW51bWJlciBmb3IgZWFjaCBkZWxldGVkIGZpbGUgYnkgb25lICYgZGVjcmVtZW50IHRoZSByZXF1ZXN0c2l6ZSBieSB0aGUgY3VycmVudCBmaWxlc2l6ZV1cbiAgICAgKiBAcGFyYW0gIHtbb2JqZWN0XX0gZmlsZVxuICAgICAqIEBwYXJhbSAge1tvYmplY3RdfSB0cmFja0RhdGFcbiAgICAgKi9cbiAgICB2YXIgdW50cmFja0ZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICB0cmFja0RhdGEuZmlsZU51bWJlciAtPSAxO1xuICAgICAgICB0cmFja0RhdGEucmVxdWVzdFNpemUgLT0gZmlsZS5zaXplO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbQ3JlYXRlcyBhIGhpZGRlbiBpbnB1dCBmaWVsZCB3aGVyZSB0aGUgYmFzZTY0IGRhdGEgaXMgc3RvcmVkXVxuICAgICAqIEBwYXJhbSAge1tvYmplY3RdfSBmaWxlT2JqIFt0aGUgYmFzZTY0IHN0cmluZyAmIGFsbCBtZXRhZGF0YSBjb21iaW5lZCBpbiBvbmUgb2JqZWN0XVxuICAgICAqL1xuICAgIHZhciBhZGRCYXNlNjRUb0RvbSA9IGZ1bmN0aW9uIChmaWxlT2JqKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG5cbiAgICAgICAgaW5wdXQudHlwZSA9ICdoaWRkZW4nO1xuICAgICAgICBpbnB1dC52YWx1ZSA9IGZpbGVPYmouZGF0YTtcbiAgICAgICAgaW5wdXQubmFtZSA9ICdmaWxlOicgKyBmaWxlT2JqLmZpbGUubmFtZTtcblxuICAgICAgICBmb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpbnB1dCk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtDcmVhdGVzIGEgbGlzdCBpdGVtIHdoaWNoIGdldHMgaW5qZWN0ZWQgdG8gdGhlIERPTV1cbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBmaWxlT2JqICAgICAgICAgICAgIFtmaWxlZGF0YSBmb3IgYWRkaW5nIHRoZSBmaWxlZGF0YSAmIHByZXZpZXcgdG8gdGhlIERPTV1cbiAgICAgKiBAcGFyYW0ge1tmdW5jdGlvbl19IHJlbW92ZUZpbGVIYW5kbGVyIFtjYWxsYmFjayBmb3Igbm90aWZ5aW5nIHRoYXQgdGhlIHNwZWNpZmllZCBmaWxlIHdhcyBkZWxldGVkXVxuICAgICAqL1xuICAgIHZhciBhZGRGaWxlVG9WaWV3ID0gZnVuY3Rpb24gKGZpbGVPYmosIHJlbW92ZUZpbGVIYW5kbGVyQ2FsbGJhY2ssIGxpc3RFbGVtZW50KSB7XG4gICAgICAgIHZhciByZW1vdmVCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG5cbiAgICAgICAgcmVtb3ZlQnV0dG9uLmNsYXNzTmFtZSA9ICdyZW1vdmUnO1xuXG4gICAgICAgIGxpc3RFbGVtZW50LmFwcGVuZENoaWxkKHJlbW92ZUJ1dHRvbik7XG4gICAgICAgIGZpbGVWaWV3LmFwcGVuZENoaWxkKGxpc3RFbGVtZW50KTtcblxuICAgICAgICByZW1vdmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZW1vdmVGaWxlSGFuZGxlckNhbGxiYWNrKHRyYWNrRGF0YSk7XG4gICAgICAgICAgICBsaXN0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGxpc3RFbGVtZW50KTtcbiAgICAgICAgICAgIHVudHJhY2tGaWxlKGZpbGVPYmouZmlsZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbaWYgcG9zc2libGUgYWRkcyBhIHRodW1ibmFpbCBvZiB0aGUgZ2l2ZW4gZmlsZSB0byB0aGUgRE9NXVxuICAgICAqIEBwYXJhbSB7W29iamVjdF19ICAgICBmaWxlICAgIFtmaWxlZGF0YSB0byBjcmVhdGUgYSB0aHVtYm5haWwgd2hpY2ggZ2V0cyBpbmplY3RlZF1cbiAgICAgKiBAcGFyYW0ge1tET00gb2JqZWN0XX0gZWxlbWVudCBbRE9NIGVsZW1lbnQgdG8gc3BlY2lmeSB3aGVyZSB0aGUgdGh1bWJuYWlsIGhhcyB0byBiZSBpbmplY3RlZF1cbiAgICAgKi9cbiAgICB2YXIgYWRkVGh1bWJuYWlsID0gZnVuY3Rpb24gKGZpbGUsIGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGNhbnZhcyAgICAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgIHZhciBFTVBUWV9JTUFHRSA9ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUFFQUFBQUJBUU1BQUFBbDIxYktBQUFBQTFCTVZFVUFBQUNuZWozYUFBQUFBWFJTVGxNQVFPYllaZ0FBQUFwSlJFRlVDTmRqWUFBQUFBSUFBZUlodkRNQUFBQUFTVVZPUks1Q1lJST0nO1xuICAgICAgICB2YXIgZmFjdG9yICAgICAgPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgdmFyIGltZ1dyYXBwZXIgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgICAgICB2YXIgcmVhZGVyICAgICAgPSBuZXcgRmlsZVJlYWRlcigpO1xuXG4gICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICBjYW52YXMud2lkdGggID0gb3B0aW9ucy50aHVtYm5haWxTaXplICogZmFjdG9yO1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gb3B0aW9ucy50aHVtYm5haWxTaXplICogZmFjdG9yO1xuXG4gICAgICAgIGlmIChmYWN0b3IgPiAxKSB7XG4gICAgICAgICAgICBjdHgud2Via2l0QmFja2luZ1N0b3JlUGl4ZWxSYXRpbyA9IGZhY3RvcjtcbiAgICAgICAgICAgIGN0eC5zY2FsZShmYWN0b3IsIGZhY3Rvcik7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZmlsZU5hbWUgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qc19uYW1lJyk7XG4gICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWdXcmFwcGVyLmNsYXNzTmFtZSA9ICd0aHVtYm5haWwnO1xuXG4gICAgICAgIGltYWdlLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmF0aW8gPSB0aGlzLmhlaWdodCAvIHRoaXMud2lkdGg7XG5cbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMud2lkdGggKiByYXRpbztcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UodGhpcywgMCwgMCwgb3B0aW9ucy50aHVtYm5haWxTaXplICogZmFjdG9yLCBvcHRpb25zLnRodW1ibmFpbFNpemUgKiByYXRpbyAqIGZhY3Rvcik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoaXNJbWFnZShmaWxlKSkge1xuICAgICAgICAgICAgICAgIGltYWdlLnNyYyA9IGV2ZW50LnRhcmdldC5yZXN1bHQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGltYWdlLnNyYyA9IEVNUFRZX0lNQUdFO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbWdXcmFwcGVyLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICAgICAgICBlbGVtZW50Lmluc2VydEJlZm9yZShpbWdXcmFwcGVyLCBmaWxlTmFtZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbQ3JlYXRlcyBhIGxpc3RFbGVtZW50IHdpdGggdGhlIGRhdGEgb2YgdGhlIHBhc3NlZCBvYmplY3RdXG4gICAgICogQHBhcmFtICB7W3R5cGVdfSBmaWxlT2JqIFt1c2VkIHRvIHB1dCB0aGUgaW5mb3JtYXRpb24gb2YgdGhlIGZpbGUgaW4gdGhlIGxpc3RFbGVtZW10XVxuICAgICAqIEByZXR1cm4ge1tvYmplY3RdfSAgICAgICBbdGhlIGxpc3RFbGVtZW50IHdoaWNoIGdldHMgaW5qZWN0ZWQgaW4gdGhlIERPTV1cbiAgICAgKi9cbiAgICB2YXIgY3JlYXRlTGlzdEVsZW1lbnQgPSBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVTaXplLCBmaWxlVHlwZSkge1xuICAgICAgICB2YXIgZmlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXG4gICAgICAgIGZpbGVFbGVtZW50LmNsYXNzTmFtZSA9ICdmaWxlJztcblxuICAgICAgICBmaWxlRWxlbWVudC5pbm5lckhUTUwgPSBbXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGpzX25hbWUgbmFtZVwiPicsXG4gICAgICAgIGZpbGVOYW1lLFxuICAgICAgICAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibGFiZWwgc2l6ZVwiPicsXG4gICAgICAgIGZpbGVTaXplLFxuICAgICAgICAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibGFiZWwgdHlwZVwiPicsXG4gICAgICAgIGZpbGVUeXBlLFxuICAgICAgICAnPC9zcGFuPicgXS5qb2luKCcnKTtcblxuICAgICAgICByZXR1cm4gZmlsZUVsZW1lbnQ7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtyZXR1cm5zIHRoZSBwcmV0dGlmaWVkIGZpbGVzdHlwZSBzdHJpbmcgYmFzZWQgb24gdGhlIHNwZWNpZmllZCBvcHRpb25zXVxuICAgICAqIEBwYXJhbSAge1tzdHJpbmddfSBmaWxlVHlwZSBbbWltZXR5cGUgb2YgZmlsZV1cbiAgICAgKiBAcmV0dXJuIHtbc3RyaW5nXX0gICAgICBbcHJldHRpZmllZCB0eXBlc3RyaW5nXVxuICAgICAqL1xuICAgIHZhciBnZXRSZWFkYWJsZUZpbGVUeXBlID0gZnVuY3Rpb24gKGZpbGVUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdIHx8ICd1bmtub3duIGZpbGV0eXBlJztcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZU51bWJlciA9IGZ1bmN0aW9uICh0cmFja0RhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHRyYWNrRGF0YS5maWxlTnVtYmVyID49IG9wdGlvbnMubWF4RmlsZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZVJlcXVlc3RTaXplID0gZnVuY3Rpb24gKHJlcXVlc3RTaXplLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChyZXF1ZXN0U2l6ZSA+PSBvcHRpb25zLm1heFJlcXVlc3RTaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZVR5cGUgPSBmdW5jdGlvbiAoZmlsZVR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmFjY2VwdGVkVHlwZXNbZmlsZVR5cGVdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlRmlsZVNpemUgPSBmdW5jdGlvbiAoZmlsZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAoZmlsZS5zaXplID4gb3B0aW9ucy5tYXhGaWxlU2l6ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGVOYW1lID0gZnVuY3Rpb24gKGZpbGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCEob3B0aW9ucy5maWxlTmFtZVJlKS50ZXN0KGZpbGUubmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbcmVtb3ZlcyBhbGwgZXJyb3JzXVxuICAgICAqL1xuICAgIHZhciByZW1vdmVFcnJvcnMgPSBmdW5jdGlvbiAoZXJyb3JXcmFwcGVyKSB7XG4gICAgICAgIGVycm9yV3JhcHBlci5pbm5lckhUTUwgPSAnJztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogW2Rpc3BsYXlzIHRoZSBFcnJvciBtZXNzYWdlICYgcmVtb3ZlcyBpdCBhbHNvIGFmdGVyIHRoZSBzcGVjaWZpZWQgdGltZW91dF1cbiAgICAgKiBAcGFyYW0gIHtbc3RyaW5nXX0gZXJyb3IgW2Vycm9yIG1lc3NhZ2Ugd2hpY2ggaGFzIHRvIGJlIGRpc3BsYXllZF1cbiAgICAgKi9cbiAgICB2YXIgc2hvd0Vycm9yTWVzc2FnZSA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICB2YXIgZXJyb3JFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblxuICAgICAgICBlcnJvckVsZW1lbnQuY2xhc3NOYW1lID0gJ2Vycm9yJztcbiAgICAgICAgZXJyb3JFbGVtZW50LmlubmVySFRNTCA9IGVycm9yO1xuXG4gICAgICAgIGNsZWFyVGltZW91dChlcnJvclRpbWVvdXRJZCk7XG5cbiAgICAgICAgZXJyb3JUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlbW92ZUVycm9ycyhlcnJvcldyYXBwZXIpO1xuICAgICAgICB9LCBvcHRpb25zLmVycm9yTWVzc2FnZVRpbWVvdXQpO1xuXG4gICAgICAgIGVycm9yV3JhcHBlci5hcHBlbmRDaGlsZChlcnJvckVsZW1lbnQpO1xuICAgICAgICBmb3JtLmluc2VydEJlZm9yZShlcnJvcldyYXBwZXIsIGZpbGVWaWV3KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBDYWxsYmFjayBmdW5jdGlvbiBmb3IgaGFuZGxpbmcgdGhlIGFzeW5jIGZpbGVyZWFkZXIgcmVzcG9uc2VcbiAgICAgKiBAcGFyYW0gIHtbc3RyaW5nXX0gZXJyICAgICBbdGhlIGVycm9ybWVzc2FnZSB3aGljaCBnZXRzIHRocm93biB3aGVuIHRoZSBmaWxlcmVhZGVyIGVycm9yZWRdXG4gICAgICogQHBhcmFtICB7W29iamVjdF19IGZpbGVPYmogW3RoZSBiYXNlNjQgc3RyaW5nICYgYWxsIG1ldGFkYXRhIGNvbWJpbmVkIGluIG9uZSBvYmplY3RdXG4gICAgICovXG4gICAgdmFyIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlciA9IGZ1bmN0aW9uIChlcnIsIGZpbGVPYmopIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWxlT2JqKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlSGFuZGxlciA9IGFkZEJhc2U2NFRvRG9tKGZpbGVPYmopO1xuICAgICAgICAgICAgdmFyIGZpbGVUeXBlID0gZ2V0UmVhZGFibGVGaWxlVHlwZShnZXRGaWxlVHlwZShmaWxlT2JqLmZpbGUpLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBsaXN0RWxlbWVudCA9IGNyZWF0ZUxpc3RFbGVtZW50KGZpbGVPYmouZmlsZS5uYW1lLCBnZXRSZWFkYWJsZUZpbGVTaXplKGZpbGVPYmouZmlsZSksIGZpbGVUeXBlKTtcbiAgICAgICAgICAgIGFkZEZpbGVUb1ZpZXcoZmlsZU9iaiwgcmVtb3ZlSGFuZGxlciwgdHJhY2tEYXRhLCBmaWxlVmlldywgbGlzdEVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAoaGFzRmlsZVJlYWRlcigpKSB7XG4gICAgICAgICAgICAgICAgYWRkVGh1bWJuYWlsKGZpbGVPYmouZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciB2YWxpZGF0ZUZpbGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICBpZiAoIXZhbGlkYXRlRmlsZU51bWJlcih0cmFja0RhdGEsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlTnVtYmVyRXJyb3I7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXZhbGlkYXRlUmVxdWVzdFNpemUodHJhY2tEYXRhLCBvcHRpb25zKSkge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMubWF4UmVxdWVzdFNpemVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdmFsaWRhdGVGaWxlVHlwZShnZXRGaWxlVHlwZShmaWxlKSwgb3B0aW9ucykpIHtcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmludmFsaWRGaWxlVHlwZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWxpZGF0ZUZpbGVTaXplKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5tYXhGaWxlU2l6ZUVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF2YWxpZGF0ZUZpbGVOYW1lKGZpbGUsIG9wdGlvbnMpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZhbGlkRmlsZU5hbWVFcnJvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBbY29udmVydHMgdGhlIGZpbGVkYXRhIGludG8gYSBiYXNlNjQgc3RyaW5nIGFuZCB2YWxpZGF0ZXMgdGhlIGZpbGVkYXRhXVxuICAgICAqIEBwYXJhbSAge1thcnJheV19ICBmaWxlcyAgW3RoZSBjb252ZXJ0ZWQgZmlsZUxpc3RPYmplY3RdXG4gICAgICovXG4gICAgdGhpcy5jb252ZXJ0RmlsZXNUb0Jhc2U2NCA9IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICBmaWxlcy5ldmVyeShmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsaWRhdGVGaWxlKGZpbGUpID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHNob3dFcnJvck1lc3NhZ2UodmFsaWRhdGVGaWxlKGZpbGUpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRyYWNrRmlsZShmaWxlKTtcblxuICAgICAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjb252ZXJ0QmFzZTY0RmlsZUhhbmRsZXIobnVsbCwge1xuICAgICAgICAgICAgICAgICAgICBkYXRhOiBldmVudC50YXJnZXQucmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnZlcnRCYXNlNjRGaWxlSGFuZGxlcihvcHRpb25zLnVua25vd25GaWxlUmVhZGVyRXJyb3IpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGZpbGUpO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFtBZGQgYSBmaWxlSW5wdXQgd2l0aCB0aGUgc2VsZWN0ZWQgZmlsZSB0byBmb3JtXVxuICAgICAqL1xuICAgIHRoaXMuYWRkU2VsZWN0ZWRGaWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZmlsZUlucHV0ID0gY3JlYXRlRmlsZUlucHV0KGZpbGVJbnB1dElkKTtcblxuICAgICAgICBmb3JtLmluc2VydEJlZm9yZShzZWxlY3RCdXR0b24sIGRyb3BCb3gpO1xuICAgICAgICBzZWxlY3RCdXR0b24uYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcblxuICAgICAgICBmaWxlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVtb3ZlRXJyb3JzKGVycm9yV3JhcHBlcik7XG5cbiAgICAgICAgICAgIHZhciBmaWxlID0gdGhpcy5maWxlc1swXTtcblxuICAgICAgICAgICAgdmFyIGZpbGVPYmogPSB7XG4gICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIHJlbW92ZUhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdW50cmFja0ZpbGUoZmlsZSwgdHJhY2tEYXRhKTtcbiAgICAgICAgICAgICAgICBmaWxlSW5wdXQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChmaWxlSW5wdXQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWxpZGF0ZUZpbGUoZmlsZSkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgc2hvd0Vycm9yTWVzc2FnZSh2YWxpZGF0ZUZpbGUoZmlsZSksIG9wdGlvbnMuZXJyb3JUaW1lb3V0SWQsIHJlbW92ZUVycm9ycywgZXJyb3JXcmFwcGVyLCBmb3JtLCBmaWxlVmlldywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgZmlsZUlucHV0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGVUeXBlID0gZ2V0UmVhZGFibGVGaWxlVHlwZShnZXRGaWxlVHlwZShmaWxlKSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdmFyIGxpc3RFbGVtZW50ID0gY3JlYXRlTGlzdEVsZW1lbnQoZmlsZS5uYW1lLCBmaWxlVHlwZSwgZ2V0UmVhZGFibGVGaWxlU2l6ZShmaWxlT2JqLmZpbGUpKTtcblxuICAgICAgICAgICAgICAgIHRyYWNrRmlsZShmaWxlLCB0cmFja0RhdGEpO1xuICAgICAgICAgICAgICAgIGFkZEZpbGVUb1ZpZXcoZmlsZU9iaiwgcmVtb3ZlSGFuZGxlciwgbGlzdEVsZW1lbnQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0ZpbGVSZWFkZXIoKSkge1xuICAgICAgICAgICAgICAgICAgICBhZGRUaHVtYm5haWwoZmlsZSwgbGlzdEVsZW1lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZpbGVJbnB1dHMuYXBwZW5kQ2hpbGQoZmlsZUlucHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5hZGRTZWxlY3RlZEZpbGUoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIElmIHRoZXJlIGlzIG5vIGZpbGVyZWFkZXIgYXZhaWxhYmxlLCB0aGVuIHRoZSBkcm9wem9uZSBzaG91bGQgbm90IGJlIGRpc3BsYXllZCBhbmQgdGhlIEZhbGxiYWNrIGlzIGRpc3BsYXllZFxuICAgICAqL1xuICAgIGlmICghaGFzRmlsZVJlYWRlcigpICYmIG9wdGlvbnMuZmFsbGJhY2tGb3JJRTgpIHtcbiAgICAgICAgc2VsZWN0QnV0dG9uLmNsYXNzTmFtZSA9ICdzZWxlY3RidXR0b24ganNfc2VsZWN0YnV0dG9uJztcblxuICAgICAgICB2YXIgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKTtcblxuICAgICAgICBzcGFuLmlubmVySFRNTCA9ICdTZWxlY3QgRmlsZSc7XG5cbiAgICAgICAgc2VsZWN0QnV0dG9uLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICBzZWxmLmFkZFNlbGVjdGVkRmlsZSgpO1xuXG4gICAgICAgIGRyb3BCb3guc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBkcm9waGFuZGxlciBjYWxscyB0aGUgZG5kSGFuZGxlciBhbHdheXMgd2hlbm4gYSBmaWxlIGdldHMgZHJvcHBlZFxuICAgICAqIEBwYXJhbSB7W29iamVjdF19IGV2ZW50IFtkcm9wRXZlbnQgd2hlcmUgdGhlIGZpbGVsaXN0IGlzIGJpbmRlZF1cbiAgICAgKi9cbiAgICBkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbm9Qcm9wYWdhdGlvbihldmVudCk7XG5cbiAgICAgICAgdmFyIGZpbGVzID0gdG9BcnJheShldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xuXG4gICAgICAgIHNlbGYuY29udmVydEZpbGVzVG9CYXNlNjQoZmlsZXMpO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xuICAgIH0pO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG90aGVyIGV2ZW50cyBhcmUgYWxzbyBoYW5kbGVkIGNhdXNlIHRoZXkgaGF2ZSB0byBiZVxuICAgICAqIEBwYXJhbSB7W29iamVjdF19IGV2ZW50IFtkcm9wRXZlbnQgd2hlcmUgdGhlIGZpbGVsaXN0IGlzIGJpbmRlZF1cbiAgICAgKi9cbiAgICBkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdlbnRlcicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG4gICAgZHJvcEJveC5hZGRFdmVudExpc3RlbmVyKCdkcmFnb3ZlcicsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBvdGhlciBldmVudHMgYXJlIGFsc28gaGFuZGxlZCBjYXVzZSB0aGV5IGhhdmUgdG8gYmVcbiAgICAgKiBAcGFyYW0ge1tvYmplY3RdfSBldmVudCBbZHJvcEV2ZW50IHdoZXJlIHRoZSBmaWxlbGlzdCBpcyBiaW5kZWRdXG4gICAgICovXG5cbiAgICBkcm9wQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBub1Byb3BhZ2F0aW9uKGV2ZW50KTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcbiAgICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRm9ybUZpbGVVcGxvYWQ7XG5cbi8qIGdsb2JhbHMgJCwgRm9ybUZpbGVVcGxvYWQgKi9cblxuJC5mbi5mb3JtRmlsZVVwbG9hZCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbnN0YW5jZU9wdGlvbnM7XG5cbiAgICAgICAgaWYgKCEkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJykpIHtcbiAgICAgICAgICAgIGluc3RhbmNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zLCAkKHRoaXMpLmRhdGEoKSk7XG4gICAgICAgICAgICAkLmRhdGEodGhpcywgJ2Zvcm1GaWxlVXBsb2FkJywgbmV3IEZvcm1GaWxlVXBsb2FkKHRoaXMsIGluc3RhbmNlT3B0aW9ucykpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuIiwiLyoqXG4gKiBbY3JlYXRlSW5wdXRFbGVtZW50IGRlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG4gKi9cbnZhciBjcmVhdGVGaWxlSW5wdXQgPSBmdW5jdGlvbiAoZmlsZUlucHV0SWQpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgZmlsZUlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcblxuICAgIGZpbGVJbnB1dC50eXBlID0gJ2ZpbGUnO1xuICAgIGZpbGVJbnB1dC5jbGFzc05hbWUgPSAnZmlsZWlucHV0JztcbiAgICBmaWxlSW5wdXRJZCArPSAxO1xuXG4gICAgZmlsZUlucHV0Lm5hbWUgPSAnZmlsZUlucHV0ICcgKyBmaWxlSW5wdXRJZDtcblxuICAgIHJldHVybiBmaWxlSW5wdXQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUZpbGVJbnB1dDtcbiIsIi8qKlxuICogUmV0dXJucyB0aGUgRmlsZXR5cGVcbiAqIEBwYXJhbSAge1t0eXBlXX0gbmF0aXZlRmlsZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgZ2V0RmlsZVR5cGUgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEZpeCBjaHJvbWl1bSBpc3N1ZSAxMDUzODI6IEV4Y2VsICgueGxzKSBGaWxlUmVhZGVyIG1pbWUgdHlwZSBpcyBlbXB0eS5cbiAgICBpZiAoKC9cXC54bHMkLykudGVzdChmaWxlLm5hbWUpICYmICFmaWxlLnR5cGUpIHtcbiAgICAgICAgcmV0dXJuICdhcHBsaWNhdGlvbi92bmQubXMtZXhjZWwnO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZS50eXBlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRGaWxlVHlwZTtcbiIsIi8qKlxuICogVGFrZXMgdGhlIG5hdGl2ZSBmaWxlc2l6ZSBpbiBieXRlcyBhbmQgcmV0dXJucyB0aGUgcHJldHRpZmllZCBmaWxlc2l6ZVxuICogQHBhcmFtICB7W29iamVjdF19IGZpbGUgW2NvbnRhaW5zIHRoZSBzaXplIG9mIHRoZSBmaWxlXVxuICogQHJldHVybiB7W3N0cmluZ119ICAgICAgW3ByZXR0aWZpZWQgZmlsZXNpemVdXG4gKi9cbnZhciBnZXRSZWFkYWJsZUZpbGVTaXplID0gZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgc2l6ZSA9IGZpbGUuc2l6ZTtcbiAgICB2YXIgc3RyaW5nO1xuXG4gICAgaWYgKHNpemUgPj0gMTAyNCAqIDEwMjQgKiAxMDI0ICogMTAyNCkge1xuICAgICAgICBzaXplID0gc2l6ZSAvICgxMDI0ICogMTAyNCAqIDEwMjQgKiAxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnVEInO1xuICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAxMDI0ICogMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgc2l6ZSA9IHNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnR0InO1xuICAgIH0gZWxzZSBpZiAoc2l6ZSA+PSAxMDI0ICogMTAyNCkge1xuICAgICAgICBzaXplID0gc2l6ZSAvICgxMDI0ICogMTAyNCAvIDEwKTtcbiAgICAgICAgc3RyaW5nID0gJ01CJztcbiAgICB9IGVsc2UgaWYgKHNpemUgPj0gMTAyNCkge1xuICAgICAgICBzaXplID0gc2l6ZSAvICgxMDI0IC8gMTApO1xuICAgICAgICBzdHJpbmcgPSAnS0InO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHNpemUgPSBzaXplICogMTA7XG4gICAgICAgIHN0cmluZyA9ICdCJztcbiAgICB9XG5cbiAgICByZXR1cm4gKE1hdGgucm91bmQoc2l6ZSkgLyAxMCkgKyAnICcgKyBzdHJpbmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFJlYWRhYmxlRmlsZVNpemU7XG4iLCIvKipcbiAqIFtoYXNGaWxlUmVhZGVyIGRlc2NyaXB0aW9uXVxuICogQHJldHVybiB7Qm9vbGVhbn0gW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgaGFzRmlsZVJlYWRlciA9IGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gISEod2luZG93LkZpbGUgJiYgd2luZG93LkZpbGVMaXN0ICYmIHdpbmRvdy5GaWxlUmVhZGVyKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gaGFzRmlsZVJlYWRlcjtcbiIsInZhciBnZXRGaWxlVHlwZSA9IHJlcXVpcmUoJy4vZ2V0LWZpbGUtdHlwZS5qcycpO1xuXG4vKipcbiAqIFtpc0ltYWdlIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSAgZmlsZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtCb29sZWFufSAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xudmFyIGlzSW1hZ2UgPSBmdW5jdGlvbiAoZmlsZSkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHJldHVybiAoL15pbWFnZVxcLy8pLnRlc3QoZ2V0RmlsZVR5cGUoZmlsZSkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0ltYWdlO1xuIiwiLyoqXG4gKiBbbWVyZ2VPcHRpb25zIGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBvcHRzICAgICAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtbdHlwZV19IGRlZmF1bHRvcHRpb25zIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge1t0eXBlXX0gICAgICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgbWVyZ2VPcHRpb25zID0gZnVuY3Rpb24gKG9wdHMsIGRlZmF1bHRPcHRpb25zLCBzZWxmKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG9wdGlvbnMgPSB7fTtcblxuICAgIGZvciAodmFyIGkgaW4gZGVmYXVsdE9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdHMgJiYgb3B0cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgb3B0aW9uc1tpXSA9IG9wdHNbaV07XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgKG9wdGlvbnNbaV0pID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1tpXSA9IG9wdGlvbnNbaV0uYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wdGlvbnNbaV0gPSBkZWZhdWx0T3B0aW9uc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3B0aW9ucztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbWVyZ2VPcHRpb25zO1xuIiwiLyoqXG4gKiBbbm9Qcm9wYWdhdGlvbiBkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge1t0eXBlXX0gZSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtbdHlwZV19ICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgbm9Qcm9wYWdhdGlvbiA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgaWYgKGV2ZW50LnByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIHJldHVybiBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGV2ZW50LnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vUHJvcGFnYXRpb247XG4iLCIvKipcbiAqIFt0b0FycmF5IGRlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7W3R5cGVdfSBvYmplY3QgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgW2Rlc2NyaXB0aW9uXVxuICovXG52YXIgdG9BcnJheSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqZWN0LCAwKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdG9BcnJheTtcbiJdfQ==
