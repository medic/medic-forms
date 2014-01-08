
var _ = require('underscore');

/**
 * @name is_omitted_value:
 *   Return true if a value has been omitted from a specific
 *   JSON form property. Omitted values are either boolean,
 *   null, or undefined, and should be substituted with a
 *   suitable default value.
 */
exports.is_omitted_value = function (_value) {
  
  return (
    _.isBoolean(_value) ||
      _.isNull(_value) || _.isUndefined(_value)
  );
};


/**
 * @name pad:
 */
exports.pad = function (_array, _n, _default_value) {

  var n = (_n - _array.length);

  if (n <= 0) {
    return _array;
  }

  var pad = [];

  for (var i = 0; i < n; ++i) {
    pad.push(_default_value);
  }

  return _array.concat(pad);
};

