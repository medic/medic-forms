
var _ = require('underscore'),
  jsdump = require('jsDump'),
  util = require('./util.js');


/* @name validation_function_map:
 *  Field type names *should* have already been validated and
 *  normalized as part of a field definition, but it's possible
 *  that our caller has neglected to do either of those things,
 *  or is even passing in raw user input directly. Use a table
 *  to ensure that only approved validation functions are called.
 */
var validation_function_map = {

  fields: 1,        /* Recursively-embedded fieldset */
  string: 2,        /* Plain text */
  number: 3,        /* Including optional decimal portion */
  integer: 4,       /* Without decimal portion */
  date: 5,          /* Timestamp with day granularity */
  timestamp: 6,     /* Timestamp with second granularity */
  day: 7,           /* Day of the week */
  week: 8,          /* Week of the year */
  month: 9,         /* Month of the year */
  select: 10,       /* Hard-coded selection list */
  reference: 11,    /* Selection list with external data */
  gps: 12,          /* Geographic point */
  image: 13,        /* Multi-format binary image data */
  email: 14         /* RFC 5321 SMTP address */
};


/**
 * @name _validation_function_for_type:
 *   Return the name of the validation function that should be
 *   used for fields of type `type`, or false if the supplied type
 *   is unknown or invalid.
 */
var _validation_function_for_type = function (_type) {

  if (validation_function_map[_type]) {
    return 'validate_' + _type;
  }

  return false;
};


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

  /* Paranoia:
   *   This should have been caught earlier, via a combination of
   *   the form definition schema and a type-specific validation
   *   function such as `validate_string` or `validate_integer`.
   *   Check it here just in case our preconditions are violated. */

  if (!_.isNumber(length)) {
    return {
      valid: false,
      error: 'Value must have a well-defined length'
    };
  }

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

  /* Return per-item information */
  var rv = { valid: true, detail: [] };

  /* Validate each member field */
  for (var i = 0, len = _input.length; i < len; ++i) {

    var r = _fn.call(this, _input[i], _field);

    if (!r.valid) {
      rv.valid = false;
    }

    /* Save result */
    rv.detail[i] = r;
  }

  return rv;
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

    return { valid: true };
  }

  /* Paranoia: see `validate_repeat` */
  return {
    valid: false,
    error: 'Value must have a well-defined length'
  };
};


/**
 * @name validate_select:
 *   Ensure that the input in `_input` refers to a valid value
 *   from the `items` property of the normalized field `_field`.
 */
exports.validate_select = function (_input, _field) {

  var map = {};
  var items = _field.items;

  /* Paranoia: should be normalized */
  if (!_.isArray(items)) {
    return {
      valid: false,
      error: 'Field specifies missing or invalid list of items'
    };
  }

  /* Type check */
  if (!_.isNumber(_input) && !_.isString(_input)) {
    return {
      valid: false,
      error: 'Input must be either a string or a number'
    };
  }

  /* Map between selection list identifiers and labels */
  for (var i = 0, len = items.length; i < len; ++i) {

    var item = items[i];

    if (!_.isArray(item) || item.length != 2) {
      return {
        valid: false, offset: i,
        error: 'Invalid format for selection list item'
      };
    }

    map[item[0]] = item[1];
  }

  /* Check for existence of value */
  if (!map[_input]) {
    return {
      valid: false,
      error: 'Value provided is not in list of allowed values'
    };
  }

  /* Provide map back to caller */
  return { valid: true, values: map };
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

  /* Handle range restrictions for any type */
  var rv = _validate_range(_input, _field);

  if (!rv.valid) {
    return rv;
  }

  /* Handle length restrictions for any type */
  rv = _validate_length(_input, _field);

  if (!rv.valid) {
    return rv;
  }

  /* Handle custom validation rules for any type */
  rv = _validate_conditions(_input, _field);

  if (!rv.valid || rv.skipped) {
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

  if (!type) {
    return {
      valid: false,
      error: 'Unspecified field type'
    };
  }

  /* Find appropriate validation function */
  var fn = _validation_function_for_type(type);

  if (!fn) {
    return {
      valid: false, type: type,
      error: 'Unknown field type'
    };
  }

  return exports[fn].call(this, _input, _field);
};


/**
 * @name _validate_validations:
 *   Validate all custom validation rules attached to the
 *   field `_field`. Return an error object containing a boolean
 *   `vaild` property, a human-readable `error` property if
 *   `valid` is false, and a `detail` object describing the
 *   validation results for each individual validation rule.
 */
var _validate_validations = function (_input, _field) {

  return { valid: true };
};


/**
 * @name _validate_javascript_validation:
 *   Validate a single validation rule written in Javascript.
 *   Returns an error object containing a boolean `vaild` property,
 *   plus a human-readable `error` property if `valid` is false.
 */
var _validate_javascript_validation = function (_input, _condition) {

  return { valid: true };
};


/**
 * @name _validate_named_validation:
 *   Validate a single validation rule specified as a simple list
 *   of named validation rules. Names will, in most circumstances,
 *   refer to built-in validation rules. Returns an error object 
 *   containing a boolean `vaild` property, plus a human-readable
 *   `error` property if `valid` is false.
 */
var _validate_javascript_validation = function (_input, _condition) {

  return { valid: true };
};


/**
 * @name _validate_conditions:
 *   Validate all skip logic conditions, ensuring that fields
 *   are omitted in all cases where a condition yields false.
 *   Returns an error object containing a boolean `vaild` property,
 *   a boolean `skipped` property indicating whether or not the
 *   field was skipped in accordance with conditions specified,
 *   a human-readable `error` property if `valid` is false, and a
 *   `detail` object describing the validation results for each
 *   individual validation rule.
 */
var _validate_conditions = function (_input, _field) {

  return { valid: true, skipped: false };
};


/**
 * @name _validate_javascript_condition:
 *   Validate a single skip logic condition written in Javascript.
 *   Returns an error object containing a boolean `vaild` property,
 *   a boolean `skipped` property indicating whether or not the
 *   field was skipped in accordance with conditions specified,
 *   plus a human-readable `error` property if `valid` is false.
 */
var _validate_javascript_condition = function (_input, _condition) {

  return { valid: true, skipped: false };
};


/**
 * @name _validate_structured_condition:
 *   Validate a single skip logic condition written in an object-based
 *   notation, where property names are field identifiers, property
 *   values are expected field values, and the special `$operator`
 *   property contains `'||'` if individual results should be combined
 *   to produce a final result using the boolean "or" operator, or
 *   `'&&'` if results should be combined using the "and" operator.
 *   Return an error object containing a boolean `vaild` property,
 *   a boolean `skipped` property indicating whether or not the
 *   field was skipped in accordance with conditions specified,
 *   plus a human-readable `error` property if `valid` is false.
 */
var _validate_structured_condition = function (_input, _condition) {

  return { valid: true, skipped: false };
};


/**
 * @name validate_all:
 *   Validate each item in `_fields` using `validate_any`.
 *   Return immediately if any field validation returns an
 *   object containing a false-like `valid` property.
 */
exports.validate_all = function (_input, _fields) {

  /* Return per-field information */
  var rv = { valid: true, detail: {} };

  if (!_.isArray(_fields)) {
    return {
      valid: false,
      error: 'The fields property must contain an array'
    };
  }

  if (!util.is_plain_object(_input)) {
    return {
      valid: false,
      error: 'Input must be a set of field values'
    };
  }

  /* Validate every field in list */
  for (var i = 0, len = _fields.length; i < len; ++i) {

    var field = _fields[i];
    var id = field.id;

    /* Paranoia: should be normalized */
    if (util.is_omitted_value(id)) {
      return {
        valid: false,
        error: 'Missing field identifier at offset ' + i
      };
    }

    /* Limit scope to this field */
    var input = _input[field.id];
    var r = exports.validate_any(input, field);

    if (!r.valid) {
      rv.valid = false;
    }

    /* Save result */
    rv.detail[id] = r;
  }

  return rv;
};


/**
 * @name validate_any:
 *   Validate input for a single field of any type, interpreting
 *   the `repeat` option along the way if necessary. If the
 *   `_force_required` option is specified, then the validation
 *   code will ignore the `required` property stored in `_field`
 *   and assume that the field is required. The `_force_required`
 *   argument will be automatically passed down to field repetition,
 *   but *will not* be inherited by embedded field sets.
 */
exports.validate_any = function (_input, _field, _force_required) {

  var required = _field.required;

  /* Allow omission of non-required fields */
  if (!_force_required) {
    if (!required && util.is_omitted_value(_input)) {
      return { valid: true };
    }
  }

  /* Handle skip-logic conditions */
  var rv = _validate_conditions(_input, _field);

  if (!rv.valid || rv.skipped) {
    return rv;
  }

  /* Handle repetition */
  if (_field.repeat) {
    return _validate_repeat(_input, _field, function (_i, _f) {

      /* Prohibit sparse arrays */
      if (util.is_omitted_value(_i)) {
        return {
          valid: false,
          error: 'Items in a repeating list may not be omitted'
        };
      }

      /* Validate item at current position */
      return _validate_any(_i, _f, _force_required);
    });
  }

  /* Handle non-repeating field */
  return _validate_any(_input, _field, _force_required);
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

  if (!util.is_integer(_input)) {
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
 *   Validate input for a field of type `week`. This data type
 *   stores a single integer week number, taken from a full year
 *   (i.e. a number between 1 and 52).
 */
exports.validate_week = function (_input, _field) {

  if (!utils.is_integer(_input)) {
    return {
      valid: false,
      error: 'Value must be a whole number'
    };
  }

  if (_input < 1 || _input > 52) {
    return {
      valid: false,
      error: 'Value must be a week number between 1 and 52'
    };
  }

  return _validate_common(_input, _field);
};


/**
 * @name validate_month:
 *   Validate input for a field of type `month`. This data type
 *   stores a single integer between one (for January) and twelve
 *   (for December).
 */
exports.validate_month = function (_input, _field) {

  if (!utils.is_integer(_input)) {
    return {
      valid: false,
      error: 'Value must be a whole number'
    };
  }

  if (_input < 1 || _input > 12) {
    return {
      valid: false,
      error: 'Value must be a month between 1 (January) and 12 (December)'
    };
  }

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
    if (_input.length < 2 || _input.length > 3) {
      return {
        valid: false,
        error: 'Value must be an array of either two or three elements'
      };
    }
    _input = {
        latitude: _input[0],
        longitude: _input[1], elevation: _input[2]
    };
  }

  /* Type check */
  if (!_.isObject(_input)) {
    return {
      valid: false,
      error: 'Value must be either an array or an object'
    };
  }

  /* Test for extra properties */
  var length = Object.keys(_input).length;

  if (length > 3) {
    return {
      valid: false,
      error: 'Value must be an object with three or fewer properties'
    };
  }

  /* Require numeric latitude and longitude */
  if (!_.isNumber(_input.latitude) || !_.isNumber(_input.longitude)) {
    return {
      valid: false,
      error: 'Value requires numeric latitude and longitude properties'
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

  if (!utils.is_integer(_input)) {
    return {
      valid: false,
      error: 'Value must be an integer'
    };
  }

  if (_input < 1 || _input > 7) {
    return {
      valid: false,
      error: 'Value must be between one (Monday) and seven (Sunday)'
    };
  }

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

