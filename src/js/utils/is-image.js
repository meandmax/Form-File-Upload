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
