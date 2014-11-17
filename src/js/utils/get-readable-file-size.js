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
