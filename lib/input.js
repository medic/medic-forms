
var _ = require('underscore'),
    jsdump = require('jsDump');


/**
 * @name _validate_range:
 */
var _validate_range = function (_number, _range) {

  return { valid: true };
};


/**
 * @name _validate_repeat:
 */
var _validate_repeat = function (_number, _array) {

  return { valid: true };
};


/**
 * @name _validate_length:
 */
var _validate_length = function (_number, _string) {

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

  return { valid: true };
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

