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
