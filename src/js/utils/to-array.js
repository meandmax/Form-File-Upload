/**
 * [toArray description]
 * @param  {[type]} object [description]
 * @return {[type]}        [description]
 */
var toArray = function (object) {
    'use strict';

    return Array.prototype.slice.call(object, 0);
};

module.exports = toArray;
