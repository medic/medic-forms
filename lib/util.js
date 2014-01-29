
var _ = require('underscore');

var _regex = {
  date: /^\d{4}-\d{2}-\d{2}$/,
  timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
}

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

/**
 * @name is_date:
 *   Return true if the string `_value` is an valid date in the
 *   format: YYYY-MM-DD
 */
exports.is_date = function (_value) {
  return _regex.date.test(_value) && Date.parse(_value);
};

/**
 * @name is_date:
 *   Return true if the string `_value` is an valid date in the
 *   format: YYYY-MM-DDTHH:mm:SS.sssZ
 */
exports.is_timestamp = function (_value) {
  return _regex.timestamp.test(_value) && Date.parse(_value);
};

/**
 * @name exec:
 *   Execute the javascript code in `_code` as a function body,
 *   providing the argument name/value mapping object `_arguments` to
 *   it as an argument list.  Returns an object containing information
 *   on the outcome of execution: the `success` property is true if
 *   the function was successfully executed or false otherwise; the
 *   `result` property contains the value returned by the function if
 *   and only if the `success` property is true; the `execption`
 *   property contains the exception thrown by the function (or the
 *   runtime) if the `success` property is false. If the `_this`
 *   argument is specified, it will be used as the value for `this`
 *   when invoking the anonymous function that contains `_code`.
 */
exports.exec = function (_code, _arguments, _this) {

  var rv = { success: false };
  var args = exports.separate_object(_arguments);

  try {

    var fn = Function.constructor.apply(
      null, args.keys.concat([ _code ])
    );

    rv.result = fn.apply(_this, args.values);
    rv.success = true;

  } catch (_e) {

    rv.exception = _e;
  }

  return rv;
};


/**
 * @name separate_object:
 *   Split the object `_object` in to an array of keys and a
 *   corresponding array of values. The return value is an object with
 *   a `keys` property and a `values` property; the `keys` property is
 *   an array of property names, and the `values` property is an array
 *   of values. If the return value is `rv`, then `rv.values[i]` is
 *   the value of the property named `rv.keys[i]` for all `i` less
 *   than `rv.length`.  Use this function when you need to create
 *   separate arrays of keys and values for a particular object, and
 *   need to ensure that the order of each matches the key/value
 *   relationship of the original object.
 */
exports.separate_object = function (_object) {

  var rv = { keys: [], values: [] };

  _.each(_object, function (_value, _key) {

    rv.keys.push(_key);
    rv.values.push(_value);
  });

  return rv;
};


