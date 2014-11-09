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
