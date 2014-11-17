'use strict';

/**
 * [noPropagation description]
 * @param  {[type]} e [description]
 * @return {[type]}   [description]
 */
var noPropagation = function (event) {
    event.stopPropagation();

    if (event.preventDefault) {
        return event.preventDefault();
    } else {
        event.returnValue = false;
        return false;
    }
};

module.exports = noPropagation;
