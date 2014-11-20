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
