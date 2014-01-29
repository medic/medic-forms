
'use strict';

var _ = require('underscore'),
    async = require('async'),
    validator = require('validator'),
    util = require('./util.js'),
    node = require('./platforms/node.js');


/**
 * @name _registered_validators:
 *   Internal storage for built-in validation functions.
 *   See `register_validator` for more information.
 */
var _registered_validators = {};


/**
 * @name _supported_image_mime_types:
 *   All the image mime types we currently support. This list
 *   will likely grow over time.
 */
var _supported_image_mime_types = {

  'image/jpeg': true, 'image/png': true,
    'image/gif': true, 'image/tiff': true
};


/**
 * @name _validation_function_map:
 *  Field type names *should* have already been validated and
 *  normalized as part of a field definition, but it's possible
 *  that our caller has neglected to do either of those things,
 *  or is even passing in raw user input directly. Use a table
 *  to ensure that only approved validation functions are called.
 */
var _validation_function_map = {

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

  if (_validation_function_map[_type]) {
    return 'validate_' + _type;
  }

  return false;
};


/**
 * @name _validate_range:
 *   Ensure that the input in `_input` is numeric and respects
 *   the range limitations dictated by `_field`. This function
 *   is *not* asynchronous.
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
 *   containing (at least) a boolean `valid` property. This
 *   function is asynchronous.
 */
var _validate_repeat = function (_input, _field, _item_fn, _fn) {

  var repeat = _field.repeat;
  var rv = { valid: true, detail: [] };

  if (!repeat) {
    return _fn.call(this, { valid: true });
  }

  /* Type check */
  if (!_.isArray(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value for a repeating field must be a list'
    });
  }

  var length = _input.length;

  /* Paranoia:
   *   This should have been caught earlier, via a combination of
   *   the form definition schema and a type-specific validation
   *   function such as `validate_string` or `validate_integer`.
   *   Check it here just in case our preconditions are violated. */

  if (!_.isNumber(length)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must have a well-defined length'
    });
  }

  /* Check length against repetition restrictions */
  if (length < repeat[0] || length > repeat[1]) {
    return _fn.call(this, {
      valid: false, repeat: repeat,
      error: (
        repeat[0] == repeat[1] ?
          'Value must repeat exactly ' +
            (repeat[0] == 1 ? 'once' : repeat[0] + ' times') :
          'Value may only repeat between ' +
            repeat[0] + ' and ' + repeat[1] + ' times'
      )
    });
  }

  /* Validate every item in the array:
   *   Run validations asynchronously but not concurrently. */

  return async.eachSeries(

    /* Arguments */
    _input,

    /* Per-item function */
    function (_input_item, _next_fn) {

      /* Delegate to type-specific handler */
      _item_fn.call(this, _input_item, _field, function (_r) {

        if (!_r.valid) {
          rv.valid = false;
        }

        /* Save result */
        rv.detail.push(_r);

        /* Signal completion */
        return _next_fn.call(this);
      });
    },

    /* Completion function */
    function (_err) {
      return _fn.call(this, (_err || rv));
    }
  );
};


/**
 * @name _validate_length:
 *   Ensure that the input in `_input` has a way of defining length,
 *   and that its length respects the limitations dictated by the
 *   normalized field `_field`. This function is *not* asynchronous.
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
exports.validate_select = function (_input, _field, _fn) {

  var i = 0;
  var map = {};
  var items = _field.items;

  /* Paranoia: should be normalized */
  if (!_.isArray(items)) {
    return _fn.call(this, {
      valid: false,
      error: 'Field specifies missing or invalid list of items'
    });
  }

  /* Type check */
  if (!_.isNumber(_input) && !_.isString(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Input must be either a string or a number'
    });
  }

  /* Validate every selection list item:
   *   We can do this synchronously, we have all of the data we
   *   need, and don't have to call any other validation functions. */

  for (var i = 0, len = items.length; i < len; ++i) {

    var item = items[i];

    /* Paranoia: should be normalized */
    if (!_.isArray(item) || item.length != 2) {
      return _fn.call(this, {
        valid: false, ordinal: i,
        error: 'Invalid format for selection list item'
      });
    }

    /* Build key/value map */
    map[item[0]] = item[1];
  }

  /* Check for existence of value */
  if (!map[_input]) {
    return _fn.call(this, {
      valid: false,
      error: 'Value provided is not in list of allowed values'
    });
  }

  /* Provide map back to caller */
  return _fn.call(this, {
    valid: true, values: map
  });
};


/**
 * @name _validate_common:
 *   Perform all validations that may be applicable to multiple
 *   data types, *except* for required fields and repetition (which
 *   are both handled automatically in `_validate_any`). If a particular
 *   type of validation does not apply to the data type specified in
 *   `_field`, that particular type of validation is not performed.
 */
var _validate_common = function (_input, _field, _fn) {

  /* Handle range restrictions for any type */
  var rv = _validate_range(_input, _field);

  if (!rv.valid) {
    return _fn.call(this, rv);
  }

  /* Handle length restrictions for any type */
  rv = _validate_length(_input, _field);

  if (!rv.valid) {
    return _fn.call(this, rv);
  }

  /* Handle custom validation rules for any type */
  rv = _validate_validations(_input, _field);

  if (!rv.valid || rv.skipped) {
    return _fn.call(this, rv);
  }

  return _fn.call(this, { valid: true });
};


/**
 * @name _validate_any:
 *   Validate any single field, without regard to any `repeat`
 *   property. This method is used internally by the exported
 *   `validate_any`.
 */
var _validate_any = function (_input, _field, _fn) {

  var type = _field.type;

  if (!type) {
    return _fn.call(this, {
      valid: false,
      error: 'Unspecified field type'
    });
  }

  /* Find appropriate validation function */
  var fn = _validation_function_for_type(type);

  if (!fn) {
    return _fn.call(this, {
      valid: false,
      type: type,
      error: 'Unknown field type'
    });
  }

  return exports[fn].call(this, _input, _field, _fn);
};


/**
 * @name _validate_validations:
 *   Validate all custom validation rules attached to the
 *   field `_field`. Return an error object containing a boolean
 *   `valid` property, a human-readable `error` property if
 *   `valid` is false, and a `detail` object describing the
 *   validation results for each individual validation rule.
 *   This function is *not* asynchronous.
 */
var _validate_validations = function (_input, _field) {

  var rv = {};
  var validations = _field.validations;

  /* Paranoia: should be normalized */
  if (util.is_omitted_value(validations)) {
    return { valid: true };
  }

  /* Build detailed result list:
   *   This list includes pass/fail information for each rule. */

  _.each(validations.javascript, function (_v, _k) {

    var r = _validate_javascript_validation(_input, _field, _v);

    if (!r.valid) {
      rv[_k] = r.error;
    }
  });

  _.each(validations.registered, function (_v, _k) {

    var r = _validate_registered_validation(_input, _k);

    if (!r.valid) {
      rv[_k] = r.error;
    }
  });

  /* Combine detailed results:
   *   Determine whether `_input` passes the set of validation rules. */

  var validator_count = (
    _.keys(validations.javascript).length +
      _.keys(validations.registered).length
  );

  var error_count = _.keys(rv).length;

  var valid = (
    (validator_count <= 0) || (
      (error_count === 0) ||
        (validations.operator === "||" && error_count < validator_count)
    )
  );

  /* Return result:
   *   The `detail` property contains error information for each rule. */

  if (!valid) {
    return {
      valid: false, detail: rv,
      error: 'Value causes one or more validations to fail'
    };
  }

  return { valid: true };
};


/**
 * @name _validate_javascript_validation:
 *   Validate a single validation rule written in Javascript.
 *   Returns an error object containing a boolean `valid` property,
 *   plus a human-readable `error` property if `valid` is false.
 *   This function is *not* asynchronous.
 */
var _validate_javascript_validation = function (_input, _field,
                                                _validation, _fn) {
  var args = {
    input: _input, field: _field
  };

  if (!util.exec('return ' + _validation, args, this).result) {
    return {
      valid: false, validation: _validation,
      error: 'Value causes a validation rule to fail'
    };
  }

  return { valid: true };
};


/**
 * @name register_validator:
 *  Register a custom validator by name. The _validation_fn will be
 *  passed the input as the first and only parameter, and is expected
 *  to return an error object containing a boolean `valid` property,
 *  plus a human-readable `error` property if `valid` is false.
 */
exports.register_validator = function (_name, _validation_fn) {

  _registered_validators[_name] = _validation_fn;
};


/**
 * @name _validate_registered_validation:
 *   Validate a single validation rule specified as a simple list
 *   of named validation rules. Names will, in most circumstances,
 *   refer to built-in validation rules. Returns an error object
 *   containing a boolean `valid` property, plus a human-readable
 *   `error` property if `valid` is false.
 */
var _validate_registered_validation = function (_input, _name) {

  return _registered_validators[_name].call(this, _input);
};


/**
 * @name _validate_conditions:
 *   Validate all skip logic conditions, ensuring that fields
 *   are omitted in all cases where a condition yields false.
 *   Returns an error object containing a boolean `valid` property,
 *   a boolean `skipped` property indicating whether or not the
 *   field was skipped in accordance with conditions specified,
 *   a human-readable `error` property if `valid` is false, and a
 *   `detail` object describing the validation results for each
 *   individual validation rule.
 */
var _validate_conditions = function (_input, _field, _inputs, _fn) {

  var rv = {};
  var conditions = _field.conditions;

  /* Paranoia: should be normalized */
  if (util.is_omitted_value(conditions)) {
    return _fn.call(this, { valid: true, skipped: false });
  }

  /* Build detailed result list:
   *   This list includes pass/fail information for each condition. */

  _.each(conditions.javascript, function (_v, _k) {

    var r = _validate_javascript_condition(_input, _field, _v);

    if (r.skipped) {
      rv[_k] = r.skipped;
    }
  });

  _.each(conditions.structured, function (_v, _k) {

    var r = _validate_structured_condition(_k, _v, _inputs);

    if (r.skipped) {
      rv[_k] = r.skipped;
    }
  });

  /* Combine results:
   *   Determine whether `_input` should have been omitted. */

  var condition_count = (
    _.keys(conditions.javascript).length +
      _.keys(conditions.structured).length
  );

  var skip_count = _.keys(rv).length;

  var should_skip = (
    (condition_count > 0) && (
      (skip_count === condition_count) ||
        (conditions.operator === "||" && skip_count > 0)
    )
  );

  /* Return result:
   *   Should the value have been omitted? If so, we have an
   *   error in any case where `_input` is a non-omitted value. */

  if (should_skip) {

    var is_omitted = (
      util.is_omitted_value(_input) || _input === ''
    );

    rv = {
      valid: is_omitted,
      skipped: true, detail: rv
    };

    if (!is_omitted) {
      rv.error = 'Value present in a field that should be skipped';
    }

    return _fn.call(this, rv);
  }

  return _fn.call(this, { valid: true, skipped: false });
};


/**
 * @name _validate_javascript_condition:
 *   Validate a single skip logic condition written in Javascript.
 *   Returns an error object containing a boolean `valid` property,
 *   a boolean `skipped` property indicating whether or not the
 *   field was skipped in accordance with conditions specified.
 *   This function is *not* asynchronous.
 */
var _validate_javascript_condition = function (_input, _field, _condition) {

  var args = {
    input: _input, field: _field
  };

  if (util.exec('return ' + _condition, args, this).result) {
    return { valid: true, skipped: true };
  }

  return {
    valid: true,
    skipped: false, condition: _condition
  };
};


/**
 * @name _validate_structured_condition:
 *   Validate a single skip logic condition. Skip iff the value of
 *   the field referenced by the given `_name` is equal to the given
 *   `_value`. This function is *not* asynchronous.
 */
var _validate_structured_condition = function (_name, _value, _inputs) {

  var equal = (_inputs[_name] === _value);

  return {
    valid: true, skipped: equal
  };
};


/**
 * @name validate_all:
 *   Validate each item in `_fields` using `validate_any`.
 *   Return immediately if any field validation returns an
 *   object containing a false-like `valid` property.
 */
exports.validate_all = function (_inputs, _fields, _fn) {

  var i = 0;
  var rv = { valid: true, detail: {} };

  if (!_.isArray(_fields)) {
    return _fn.call(this, {
      valid: false,
      error: 'The fields property must contain an array'
    });
  }

  if (!util.is_plain_object(_inputs)) {
    return _fn.call(this, {
      valid: false,
      error: 'Input must be a set of field values'
    });
  }

  /* Validate every field:
   *   Run validations asynchronously but not concurrently. */

  return async.eachSeries(

    /* Arguments */
    _fields,

    /* Per-item callback */
    function (_field, _callback) {

      var id = _field.id;

      /* Count fields */
      ++i;

      /* Paranoia: should be normalized */
      if (util.is_omitted_value(id)) {
        return _callback.call(this, {
          valid: false, ordinal: i,
          error: 'Missing field identifier'
        });
      }

      /* Validate the current field */
      return exports.validate_any(
        _inputs[id], _field, _inputs, {}, function (_r) {

          if (!_r.valid) {
            rv.valid = false;
          }

          /* Save result */
          rv.detail[id] = _r;

          /* Signal completion */
          return _callback.call(this);
        }
      );
    },

    /* Completion callback */
    function (_err) {
      return _fn.call(this, (_err || rv));
    }
  );
};


/**
 * @name _validate_any_repeated:
 */
var _validate_any_repeated = function (_input, _field, _fn) {

  /* For every repeated item */
  return _validate_repeat(

    /* Arguments */
    _input, _field,

    /* Per-item function */
    function (_input_item, _field_item, _next_fn) {

      /* Prohibit sparse arrays */
      if (util.is_omitted_value(_input_item)) {
        return _next_fn.call(this, {
          valid: false,
          error: 'Items in a repeating list may not be omitted'
        });
      }

      /* Validate item at current position */
      return _validate_any(
        _input_item, _field_item, _next_fn
      );
    },

    /* Completion function */
    function (_rv) {
      return _fn.call(this, _rv);
    }
  );
};


/**
 * @name validate_any:
 *   Validate input for a single field of any type, interpreting
 *   the `repeat` option along the way if necessary. The `_inputs`
 *   parameter is an associative array of field ids to field values
 *   and allows for checking conditions against other fields. If the
 *   `_force_required` option is specified, then the validation
 *   code will ignore the `required` property stored in `_field`
 *   and assume that the field is required. The `_force_required`
 *   argument will be automatically passed down to field repetition,
 *   but *will not* be inherited by embedded field sets.
 */
exports.validate_any = function (_input, _field,
                                 _inputs, _options, _fn) {

  var required = _field.required;
  var options = (_options || {});

  /* Allow omission of non-required fields */
  if (!options.force_required) {

    /* Special case:
     *   The empty string counts as an omitted value. */

    var is_omitted_string = (
      (_field.type == 'string' && _input === '')
    );

    /* General rule:
     *   If the value isn't required and has been omitted, then
     *   we've skipped a non-required field and everything's okay. */

    if (!required && (is_omitted_string || util.is_omitted_value(_input))) {
      return _fn.call(this, { valid: true, omitted: true });
    }
  }

  return async.waterfall([

    function (_next_fn) {
      return _validate_conditions(_input, _field, _inputs, function (_r) {
        return _next_fn.call(this, null, _r);
      });
    },

    function (_rv, _next_fn) {

      /* Error check */
      if (!_rv.valid || _rv.skipped) {
        return _next_fn.call(this, null, _rv);
      }

      /* Handle repetition */
      if (_field.repeat) {
        return _validate_any_repeated(_input, _field, function (_r) {
          return _next_fn.call(this, null, _r);
        });
      }

      /* Handle non-repeating field */
      return _validate_any(_input, _field, function (_r) {
        return _next_fn.call(this, null, _r);
      });
    }

  ], function (_err, _rv) {

    /* Completion */
    return _fn.call(this, _rv);
  });
};


/**
 * @name validate_fields:
 *   Validate input for a field of type `field`; this type
 *   recursively embeds a set of fields.
 */
exports.validate_fields = function (_input, _field, _fn) {

  return exports.validate_all(_input, _field.fields, _fn);
};


/**
 * @name validate_string:
 *   Validate input for a field of type `string`.
 */
exports.validate_string = function (_input, _field, _fn) {

  if (!_.isString(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a single plain-text string'
    });
  }

  return _validate_common(_input, _field, _fn);
};


/**
 * @name validate_integer:
 *   Validate input for a field of type `integer`.
 */
exports.validate_integer = function (_input, _field, _fn) {

  if (!_.isNumber(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be an integer'
    });
  }

  if (!util.is_integer(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must not contain a decimal portion'
    });
  }

  return _validate_common(_input, _field, _fn);
};


/**
 * @name validate_number:
 *   Validate input for a field of type `number`.
 */
exports.validate_number = function (_input, _field, _fn) {

  if (!_.isNumber(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be numeric'
    });
  }

  return _validate_common(_input, _field, _fn);
};


/**
 * @name validate_date:
 *   Validate input for a field of type `date`.
 */
exports.validate_date = function (_input, _field, _fn) {

  if (!util.is_date(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a valid date'
    });
  }
  return _validate_common(_input, _field, _fn);
};


/**
 * @name validate_timestamp:
 *   Validate input for a field of type `timestamp`; this is
 *   both a calendar-based date and a time collapsed in to a
 *   single data type.
 */
exports.validate_timestamp = function (_input, _field, _fn) {

  if (!util.is_timestamp(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a valid timestamp'
    });
  }
  return _validate_common(_input, _field, _fn);
};


/**
 * @name validate_week:
 *   Validate input for a field of type `week`. This data type
 *   stores a single integer week number, taken from a full year
 *   (i.e. a number between 1 and 52).
 */
exports.validate_week = function (_input, _field, _fn) {

  if (!util.is_integer(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a whole number'
    });
  }

  if (_input < 1 || _input > 52) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a week number between 1 and 52'
    });
  }

  return _validate_common(_input, _field, _fn);
};


/**
 * @name validate_month:
 *   Validate input for a field of type `month`. This data type
 *   stores a single integer between one (for January) and twelve
 *   (for December).
 */
exports.validate_month = function (_input, _field, _fn) {

  if (!util.is_integer(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a whole number'
    });
  }

  if (_input < 1 || _input > 12) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a month between 1 (January) and 12 (December)'
    });
  }

  return _validate_common(_input, _field, _fn);
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
exports.validate_gps = function (_input, _field, _fn) {


  /* Accept array form */
  if (_.isArray(_input)) {
    if (_input.length < 2 || _input.length > 3) {
      return _fn.call(this, {
        valid: false,
        error: 'Value must be an array of either two or three elements'
      });
    }
    _input = {
      latitude: _input[0],
      longitude: _input[1], elevation: _input[2]
    };
  }

  /* Type check */
  if (!_.isObject(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be either an array or an object'
    });
  }

  /* Test for extra properties */
  var length = _.keys(_input).length;

  if (length > 3) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be an object with three or fewer properties'
    });
  }

  /* Require numeric latitude and longitude */
  if (!_.isNumber(_input.latitude) || !_.isNumber(_input.longitude)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value requires numeric latitude and longitude properties'
    });
  }

  /* Require elevation if field dictates */
  if (_field.elevation && !_.isNumber(_input.elevation)) {
    return _fn.call(this, {
      valid: false,
      error: 'Field requires that a numeric elevation value be specified'
    });
  }

  /* Validate latitude */
  if (!(_input.latitude >= -90.0 && _input.latitude <= 90.0)) {
    return _fn.call(this, {
      valid: false,
      error: "Latitude value must be number between -90.0 and 90.0"
    });
  }

  /* Validate longitude */
  if (!(_input.longitude >= -180.0 && _input.longitude <= 180.0)) {
    return _fn.call(this, {
      valid: false,
      error: "Longitude value must be number between -180.0 and 180.0"
    });
  }

  return _validate_common(_input, _field, _fn);
};


/**
 @name validate_image:
 *   Validate input for a field of type `image`. This type
 *   represents image data encoded as base64 data, with optional
 *   restrictions on the image format (e.g. "jpeg", "png",
 *   "gif", "tiff").
 *
 * @param  {[type]} _input
 * @param  {[type]} _field
 */
exports.validate_image = function (_input, _field, _fn) {

  var mmmagic = node.mmmagic;

  /* Step one:
   *   Test if _input is a valid base64 string.
   *   All characters should be A-Z, a-z, 0-9, +, /, or =.
   */
  var data = _input.data;
  var base64test = /[^A-Za-z0-9\+\/\=]/g;

  if (data.length <= 0 || base64test.exec(data)) {
    return _fn.call(this, {
      valid: false,
      error: "Input contains invalid base64 characters"
    });
  }

  /* Are we running client-side?
   *   If so, we can't do anything more, and the image validates. */

  if (!mmmagic) {
    return _validate_common(_input, _field, _fn);
  }

  /* Server-side: File type detection library */
  var detector = new mmmagic.Magic(node.mmmagic.MAGIC_MIME_TYPE);

  /* Step two:
   *   Decode the base64 string, then detect the mime type
   *   of the file using the file's header and/or magic number.
   */
  var buf = new Buffer(data, 'base64');

  detector.detect(buf, function (_err, _result) {

    if (_err) {
      throw _err;
    }

    if (!_supported_image_mime_types[_result]) {
      return _fn.call(this, {
        valid: false,
        error: "Not a supported image type"
      });
    }

    return _validate_common(_input, _field, _fn);
  });
};


/**
 * @name validate_day:
 *   Validate input for a field of type `day`. This type
 *   represents a single integer day-of-the-week, ranging
 *   between 1 (Monday) and 7 (Sunday).
 */
exports.validate_day = function (_input, _field, _fn) {

  if (!util.is_integer(_input)) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be an integer'
    });
  }

  if (_input < 1 || _input > 7) {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be between one (Monday) and seven (Sunday)'
    });
  }

  return _validate_common(_input, _field, _fn);
};


/**
 * @name validate_email:
 *   Validate input for a field of type `email`. This type
 *   represents a single e-mail address as outlined in RFC
 *   5321 and RFC 5322.
 */
exports.validate_email = function (_input, _field, _fn) {

  if (!validator.isEmail(_input)) {

    return _fn.call(this, {
      valid: false,
      error: 'Value must be a valid email address'
    });
  }

  return _validate_common(_input, _field, _fn);
};

