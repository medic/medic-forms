
var _ = require('underscore'),
    jsdump = require('jsDump');


/**
 * @name _validate_range:
 *   Ensure that the input in `_input` is numeric and respects
 *   the range limitations dictated by `_field`.
 */
var _validate_range = function (_input, _field) {

  var range = _field.range;

  /* Paranoia: should be normalized */
  if (!range) {
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

  if (!_field.length) {
    return { valid: true };
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
      valid: false,
      error: 'Unknown field type', type: type
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

  return { valid: true };
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

  return { valid: true };
};


/**
 * @name validate_date:
 */
exports.validate_date = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_timestamp:
 */
exports.validate_timestamp = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_week:
 */
exports.validate_week = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_month:
 */
exports.validate_month = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_gps:
 */
exports.validate_gps = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_image:
 */
exports.validate_image = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_day:
 */
exports.validate_day = function (_input, _field) {

  return { valid: true };
};


/**
 * @name validate_email:
 */
exports.validate_email = function (_input, _field) {

  return { valid: true };
};

