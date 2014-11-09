/**
 * [extractDOMNodes description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
var extractDomNodes = function (obj) {
    'use strict';

    if (typeof obj === 'function') {
        return obj[0];
    }

    return obj;
};

module.exports = extractDomNodes;
