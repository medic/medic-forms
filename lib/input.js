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
        valid: false,
        range: range,
        error: 'Value must be between ' + range[0] + ' and ' + range[1]
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

  if (!_field.repeat) {
    return { valid: true };
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

  if (!_field.required) {
    return { valid: true };
  }

  return { valid: true };
};


/**
 * @name _validate_common:
 *   Perform all validations that are applicable to multiple
 *   data types, *except* for repetition (which is handled in
 *   `validate_any`). If a particular type of validation does
 *   not apply to the data type specified in `_field`, that
 *   particular type of validation is not performed.
 */
var _validate_common = function (_input, _field) {

  var rv = _validate_required(_input, _field);

  if (!rv.valid) {
    return rv;
  }

  rv = _validate_range(_input, _field);

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
 * @name validate_any:
 */
exports.validate_any = function (_input, _field) {

  var type = _field.type;

  if (!type) {
    return {
      valid: false,
      error: 'Unspecified field type'
    };
  }

  /* Repetitive, but safe:
   *   The field definition in `_field` *should* have already
   *   been validated and normalized, but it's possible that
   *   our caller has neglected to do either of those things,
   *   or is even passing in raw user input directly. Use a
   *   table to ensure only approved functions are called.
   */
  var map = {
    fields: 'validate_fields',
    string: 'validate_string',
    integer: 'validate_integer',
    number: 'validate_number',
    date: 'validate_date',
    timestamp: 'validate_timestamp',
    gps: 'validate_gps',
    image: 'validate_image',
    week: 'validate_week',
    month: 'validate_month',
    day: 'validate_day',
    email: 'validate_email'
  };

  var fn = map[type];

  if (!fn) {
    return {
      valid: false,
      error: 'Unknown field type',
      type: type
    };
  }

  return exports[fn].call(this, _input, _field);
};


/**
 * @name validate_fields:
 */
exports.validate_fields = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_string:
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
 */
exports.validate_date = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_timestamp:
 */
exports.validate_timestamp = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_week:
 */
exports.validate_week = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_month:
 */
exports.validate_month = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_gps:
    GPS: [ latitude, longitude, (elevation)] or
    {
      latitude: 70.00,
      longitude: 80.11,
      elevation: 8999
    }
    - latitude [-90, 90] inclusive
    - longitude [-180, 180] include
    - If elevation is optional. Only required when elevation = true
 */
exports.validate_gps = function (_input, _field) {

  // return _validate_common(_input, _field);

  var rv = _validate_required(_input, _field);

  if (!rv.valid) {
    return rv;
  }
  //TODOs:
  //valid whether elevation is required and validate its value
  if (_field.elevation) {
    if ((_.isArray(_input) && _input.length != 3) ||
      (_.isObject(_input) && Object.keys(_input).length != 3)) {
      return {
        valid: false,
        error: "must have three elements for latitude, longitude and elevation"
      };
    }
  } else {
    if ((_.isArray(_input) && _input.length != 2) ||
      (_.isObject(_input) && Object.keys(_input).length != 2)) {
      return {
        valid: false,
        error: "must have two elements for latitude and longitude"
      };
    }
  }

  //validate latitude value
  var latitude = ((_.isArray(_input) && _input[0]) ||
                  (_.isObject(_input) && _input.latitude));
  if (!(latitude && _.isNumber(latitude) &&
          latitude >= -90 && latitude <= 90)) {
    return {
      valid: false,
      error: "latitude must be number between -90 to 90"
    };
  }

  //validate longitude
  var longitude = ((_.isArray(_input) && _input[1]) ||
                  (_.isObject(_input) && _input.longitude));
  if (!(longitude && _.isNumber(longitude) &&
          longitude >= -180 && longitude <= 180)) {
    return {
      valid: false,
      error: "longitude must be number between -180 to 180"
    };
  }

  //validate elevation longitude
  if (_field.elevation) {
    var elevation = ((_.isArray(_input) && _input[0]) ||
                    (_.isObject(_input) && _input.elevation));
    if (!(elevation && _.isNumber(elevation))) {
      return {
        valid: false,
        error: "elevation must be number"
      };
    }
  }

  return { valid: true };

};


/**
 * @name validate_image:
 */
exports.validate_image = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_day:
 */
exports.validate_day = function (_input, _field) {

  return _validate_common(_input, _field);
};


/**
 * @name validate_email:
 */
exports.validate_email = function (_input, _field) {

  return _validate_common(_input, _field);
};