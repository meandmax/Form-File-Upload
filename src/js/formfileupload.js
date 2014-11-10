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
