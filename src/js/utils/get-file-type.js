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
