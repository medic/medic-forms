var _ = require('underscore'),
  jsdump = require('jsDump'),
  util = require('./util.js');


/**
 * @name _validate_range:
 *   Ensure that the input in `_input` is numeric and respects
 *   the range limitations dictated by `_field`.
 */
var _validate_range = function (_input, _field) {

  var range = _field.range;

  if (util.is_omitted_value(range)) {
    return { valid: true };
  }

  /* Paranoia: should be normalized */
  if (!_.isArray(range)) {
    return {
      valid: false,
      error: 'Field specifies `range` option improperly'
    };
  }

  /* Numeric case */
  if (_.isNumber(_input)) {
    if (_input < range[0] || _input > range[1]) {
      return {
        valid: false, range: range,
        error: (
          range[0] == range[1] ?
            'Value must be exactly ' + range[0] :
            'Value must be between ' + range[0] + ' and ' + range[1]
        )
      };
    }
  }

  return { valid: true };
};


/**
 * @name _validate_repeat:
 *   Ensure that `_input` is a valid repeating data structure, and
 *   that the structure respects the repetition limits dictated by
 *   the normalized field `_field`. Provided this is the case,
 *   invoke `_fn(_input, _field)` for each item in the repeating
 *   data structure. The `_fn` callback must return an object
 *   containing (at least) a boolean `valid` property.
 */
var _validate_repeat = function (_input, _field, _fn) {

  var repeat = _field.repeat;

  if (!repeat) {
    return { valid: true };
  }

  /* Type check */
  if (!_.isArray(_input)) {
    return {
      valid: false,
      error: 'Repeating field must contain a list of field values'
    };
  }

  var length = _input.length;

  /* Check length against repetition restrictions */
  if (length < repeat[0] || length > repeat[1]) {
    return {
      valid: false, repeat: repeat,
      error: (
        repeat[0] == repeat[1] ?
          'Value must repeat exactly ' +
            (repeat[0] == 1 ? 'once' : repeat[0] + ' times') :
          'Value may only repeat between ' +
            repeat[0] + ' and ' + repeat[1] + ' times'
      )
    };
  }

  /* Validate each member field */
  for (var i = 0, len = _input.length; i < len; ++i) {

    var rv = _fn.call(this, _input[i], _field);

    if (!rv.valid) {
      return rv;
    }
  }

  return { valid: true };
};


/**
 * @name _validate_length:
 *   Ensure that the input in `_input` has a way of defining length,
 *   and that its length respects the limitations dictated by the
 *   normalized field `_field`.
 */
var _validate_length = function (_input, _field) {

  var length = _field.length;

  if (util.is_omitted_value(length)) {
    return { valid: true };
  }

  /* Paranoia: should be normalized */
  if (!_.isArray(length)) {
    return {
      valid: false,
      error: 'Field specifies `length` option improperly'
    };
  }

  /* Numeric case */
  if (_.isNumber(_input)) {
    _input = _input.toString(10);
  }

  /* String case */
  if (_.isString(_input)) {
    if (_input.length < length[0] || _input.length > length[1]) {
      return {
        valid: false,
        length: length,
        error: 'String length must be between ' +
          length[0] + ' and ' + length[1] + ' characters'
      };
    }
  }
  return { valid: true };
};


/**
 * @name _validate_required:
 *   Ensure that the input in `_input` respects the `required`
 *   property of the normalized field `_field`.
 */
var _validate_required = function (_input, _field) {

  if (!util.is_omitted_value(_input) && !_field.required) {
    return { valid: true };
  }

  return { valid: true };
};


/**
 * @name _validate_common:
 *   Perform all validations that may be applicable to multiple
 *   data types, *except* for required fields and repetition (which
 *   are both handled automatically in `_validate_any`). If a particular
 *   type of validation does not apply to the data type specified in
 *   `_field`, that particular type of validation is not performed.
 */
var _validate_common = function (_input, _field) {

  var rv = _validate_range(_input, _field);

  if (!rv.valid) {
    return rv;
  }

  rv = _validate_length(_input, _field);

  if (!rv.valid) {
    return rv;
  }

  return { valid: true };
};


/**
 * @name _validate_any:
 *   Validate any single field, without regard to any `repeat`
 *   property. This method is used internally by the exported
 *   `validate_any`.
 */
var _validate_any = function (_input, _field) {

  var type = _field.type;
  var required = _field.required;

  if (!type) {
    return {
      valid: false,
      error: 'Unspecified field type'
    };
  }

  /* Allow omission of non-required fields */
  if (!required && util.is_omitted_value(_input)) {
    return { valid: true };
  }

  /* Repetitive, but safe:
   *   The field definition in `_field` *should* have already
   *   been validated and normalized, but it's possible that
   *   our caller has neglected to do either of those things,
   *   or is even passing in raw user input directly. Use a
   *   table to ensure only approved functions are called.
   */
  var map = {
    fields: 'validate_fields', string: 'validate_string',
    integer: 'validate_integer', number: 'validate_number',
    date: 'validate_date', timestamp: 'validate_timestamp',
    gps: 'validate_gps', image: 'validate_image',
    week: 'validate_week', month: 'validate_month',
    day: 'validate_day', email: 'validate_email'
  };

  var fn = map[type];

  if (!fn) {
    return {
      valid: false, type: type,
      error: 'Unknown field type'
    };
  }

  return exports[fn].call(this, _input, _field);
};


/**
 * @name validate_all:
 *   Validate each item in `_fields` using `validate_any`.
 *   Return immediately if any field validation returns an
 *   object containing a false-like `valid` property.
 */
exports.validate_all = function (_input, _fields) {

  if (!_.isArray(_fields)) {
    return {
      valid: false,
      error: 'The fields property must contain an array'
    };
  }
};


/**
 * @name validate_any:
 *   Validate input for a single field of any type, interpreting
 *   the `repeat` option along the way if necessary.
 */
exports.validate_any = function (_input, _field) {

  if (_field.repeat) {
    return _validate_repeat(_input, _field, function (_i, _f) {
      return _validate_any(_i, _f);
    });
  }

  return _validate_any(_input, _field);
};


/**
 * @name validate_fields:
 *   Validate input for a field of type `field`; this type
 *   recursively embeds a set of fields.
 */
exports.validate_fields = function (_input, _field) {

  return exports.validate_all(_input, _field.fields);
};


/**
 * @name validate_string:
 *   Validate input for a field of type `string`.
 */
exports.validate_string = function (_input, _field) {

  if (!_.isString(_input)) {
    return {
      valid: false,
      error: 'Value must be a single plain-text string'

    };
  }
  return _validate_common(_input, _field);
};


/**
 * @name validate_integer:
 *   Validate input for a field of type `integer`.
 */
exports.validate_integer = function (_input, _field) {

  if (!_.isNumber(_input)) {
    return {
      valid: false,
      error: 'Value must be an integer'
    };
  }

  if (Math.floor(_input) != _input) {
    return {
      valid: false,
      error: 'Value must not contain a decimal portion'
    };
  }

  return _validate_common(_input, _field);
};


/**
 * @name validate_number:
 *   Validate input for a field of type `number`.
 */
exports.validate_number = function (_input, _field) {

  if (!_.isNumber(_input)) {
    return {
      valid: false,
      error: 'Value must be numeric'
    };
  }

  return _validate_common(_input, _field);
};


/**
 * @name validate_date:
 *   Validate input for a field of type `date`.
 */
exports.validate_date = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_timestamp:
 *   Validate input for a field of type `timestamp`; this is
 *   both a calendar-based date and a time collapsed in to a
 *   single data type.
 */
exports.validate_timestamp = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_week:
 *   Validate input for a field of type `week`; this data type
 *   stores a single integer week number, taken from a full year
 *   (i.e. a number between 1 and 52).
 */
exports.validate_week = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_month:
 *   Validate input for a field of type `date`.
 */
exports.validate_month = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_gps:
 *   Validate input for a field of type `gps`. This type
 *   represents a single latitude/longitude coordinate, with
 *   optional elevation.
 *
 *  GPS coordinate format:
 *    [ latitude, longitude, (elevation)]
 *    { latitude: 70.00, longitude: 80.11, elevation: 8999 }
 *
 *  Latitude: [-90, 90] inclusive
 *  Longitude: [-180, 180] inclusive.
 *  Elevation: optional. Only required when `elevation = true`.
 */
exports.validate_gps = function (_input, _field) {

  /* Accept array form */
  if (_.isArray(_input)) {
    _input = {
        latitude: _input[0],
        longitude: _input[1], elevation: _input[2]
    };
  }

  /* Type check */
  if (!_.isObject(_input)) {
    return {
      valid: false,
      error: 'Field must be either an array or an object'
    };
  }

  /* Require numeric latitude and longitude */
  if (!_.isNumber(_input.latitude) || !_.isNumber(_input.longitude)) {
    return {
      valid: false,
      error: 'Field requires numeric latitude and longitude properties'
    };
  }

  /* Require elevation if field dictates */
  if (_field.elevation && !_.isNumber(_input.elevation)) {
    return {
      valid: false,
      error: 'Field requires that a numeric elevation value be specified'
    };
  }

  /* Validate latitude */
  if (!(_input.latitude >= -90.0 && _input.latitude <= 90.0)) {
    return {
      valid: false,
      error: "Latitude value must be number between -90.0 and 90.0"
    };
  }

  /* Validate longitude */
  if (!(_input.longitude >= -180.0 && _input.longitude <= 180.0)) {
    return {
      valid: false,
      error: "Longitude value must be number between -180.0 and 180.0"
    };
  }

  return _validate_common(_input, _field);
};


/**
 * @name validate_image:
 *   Validate input for a field of type `image`. This type
 *   represents image data encoded as base64 data, with optional
 *   restrictions on the image format (e.g. "jpeg", "png",
 *   "gif", "tiff").
 */
exports.validate_image = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_day:
 *   Validate input for a field of type `day`. This type
 *   represents a single integer day-of-the-week, ranging
 *   between 1 (Monday) and 7 (Sunday).
 */
exports.validate_day = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_email:
 *   Validate input for a field of type `email`. This type
 *   represents a single e-mail address as outlined in RFC
 *   5321 and RFC 5322.
 */
exports.validate_email = function (_input, _field) {

  return _validate_common(_input, _field);
};
