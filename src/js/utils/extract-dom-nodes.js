'use strict';

/**
 * [extractDOMNodes description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
var extractDomNodes = function (obj) {
    if (typeof obj === 'function') {
        return obj[0];
    }

    return obj;
};

module.exports = extractDomNodes;
