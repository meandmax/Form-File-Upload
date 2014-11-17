'use strict';

/**
 * [hasFileReader description]
 * @return {Boolean} [description]
 */
var hasFileReader = function () {
    return !!(window.File && window.FileList && window.FileReader);
};

module.exports = hasFileReader;
