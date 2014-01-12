
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
 *   Pad the array `_array` out to a length of `_n`, provided
 *   it is not already of an equal or greater length, using
 *   the value provided in `_default_value`.
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


/**
 * @name is_integer:
 *   Return true if `_value` is numeric and contains no decimal
 *   portion; otherwise return false.
 */
exports.is_integer = function (_value) {

  return (
    _.isNumber(_value) &&
      (Math.floor(_value) === _value)
  );
};

/**
 * @name is_plain_object:
 *   Return true if the object `_object` is an ordinary
 *   anonymous object; false otherwise.
 */
exports.is_plain_object = function (_object) {

  return (
    _.isObject(_object) && !_.isArray(_object) &&
      !_.isElement(_object) && !_.isDate(_object) &&
        !_.isRegExp(_object) && !_.isArguments(_object)
  );
};

