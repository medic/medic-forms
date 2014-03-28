/**
 * Medic Forms: A flexible data collection system
 *
 * Copyright 2013-2014 David Brown <david@medicmobile.org>
 * Copyright 2013-2014 Medic Mobile, Inc. <hello@medicmobile.org>
 * All rights reserved.
 *
 * Medic Forms is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation, version three.
 *
 * You should have received a copy of version three of the GNU General
 * Public License along with this file. If you did not, you can download a
 * copy from http://www.gnu.org/licenses/.
 *
 * Medic Forms is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
 * Public License for more details.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL DAVID BROWN OR MEDIC MOBILE BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var clone = require('clone'),
    async = require('async'),
    _ = require('underscore'),
    util = require('./util.js'),
    validator = require('./validate.js'),
    normalizer = require('./normalize.js'),
    node = require('./platforms/node.js'),
    node_validator = require('validator');


/**
 * @name _registered_validators:
 *   Internal storage for built-in validation functions.
 *   See `register_validator` for more information.
 */
var _registered_validators = {};


/**
 * @name _supported_image_mime_types:
 *   All the image mime types we currently support via the
 *   `image` field type. This is a whitelist and will likely
 *   grow over time as more types are added.
 */
var _supported_image_mime_types = {

  'image/jpeg': true, 'image/png': true,
    'image/gif': true, 'image/tiff': true
};


/**
 * @name _supported_scriptable_properties:
 *   A whitelist for properties that support evaluating a script
 *   object of the form `{ "javascript": "..." }`. The javascript
 *   fragment is executed and its return value is used. All of the
 *   properties in this list must export both a validation function
 *   (from `lib/validate.js`, as `validate_${name}_property`) and a
 *   a normalization function (from `lib/normalize.js, exported as
 *   `normalize_${name}_property`).
 */
var _supported_scriptable_properties = {

  required: 1, length: 2,
    range: 3, repeat: 4, default: 5
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
var _validate_range = function (_input, _field, _fn) {

  var range = _field.range;

  if (util.is_omitted_value(range)) {
    return _fn.call(this, { valid: true });
  }

  /* Paranoia: should be normalized */
  if (!_.isArray(range)) {
    return _fn.call(this, {
      valid: false,
      error: 'Field specifies `range` option improperly'
    });
  }

  /* Numeric case */
  if (_.isNumber(_input)) {
    if (_input < range[0] || _input > range[1]) {
      return _fn.call(this, {
        valid: false, range: range,
        error: (
          range[0] == range[1] ?
            'Value must be exactly ' + range[0] :
            'Value must be between ' + range[0] + ' and ' + range[1]
        )
      });
    }
  }

  return _fn.call(this, { valid: true });
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

  async.eachSeries(

    /* Arguments */
    _input,

    /* Per-item function */
    function (_input_item, _next_fn) {

      /* Delegate to type-specific handler */
      _item_fn.call(this, _input_item, _field, function (_r) {

        /* Global validity */
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

  return this;
};


/**
 * @name _validate_length:
 *   Ensure that the input in `_input` has a way of defining length,
 *   and that its length respects the limitations dictated by the
 *   normalized field `_field`. This function is *not* asynchronous.
 */
var _validate_length = function (_input, _field, _inputs, _fn) {

  async.waterfall([

    /* Step one: Ensure literal value */
    function (_next_fn) {

      /* Process script fragment if necessary:
       *   If there isn't one, this yields `_field.required`. */

      _process_scriptable_property(
        'length', _input, _field, _inputs, function (_rv) {
          util.async_error_check(this, _rv, _next_fn, true);
        }
      );
    },

    /* Step two: Check length */
    function (_rv, _next_fn) {

      var length = _rv.field.length;

      if (util.is_omitted_value(length)) {
        return _next_fn.call(this);
      }

      /* Paranoia: should be normalized */
      if (!_.isArray(length)) {
        return _next_fn.call(this, {
          valid: false,
          error: 'Field specifies `length` option improperly'
        });
      }

      /* Numeric case */
      if (_.isNumber(_input)) {
        _input = _input.toString(10);
      }

      /* String case */
      if (_.isString(_input)) {
        if (_input.length < length[0] || _input.length > length[1]) {
          return _next_fn.call(this, {
            valid: false, length: length,
            error: 'String length must be between ' +
              length[0] + ' and ' + length[1] + ' characters'
          });
        }

        return _next_fn.call(this);
      }

      /* All other types unsupported */
      return _next_fn.call(this, {
        valid: false,
        error: 'Value must have a well-defined length'
      });
    }

  ], function (_err, _rv) {

    if (_err) {
      return _fn.call(this, _err);
    }

    return _fn.call(this, { valid: true });
  });

  return this;
};


/**
 * @name _validate_common:
 *   Perform all validations that may be applicable to multiple
 *   data types, *except* for required fields and repetition (which
 *   are both handled automatically in `_validate_any`). If a particular
 *   type of validation does not apply to the data type specified in
 *   `_field`, that particular type of validation is not performed.
 */
var _validate_common = function (_input, _inputs, _field, _fn) {

  async.waterfall([

    /* Step one: Range validation */
    function (_next_fn) {

      _validate_range(_input, _field, function (_rv) {
        return util.async_error_check(this, _rv, _next_fn);
      });
    },

    /* Step two: Length validation */
    function (_next_fn) {

      _validate_length(_input, _field, _inputs, function (_rv) {
        return util.async_error_check(this, _rv, _next_fn);
      });
    },

    /* Step three: Custom validation rules */
    function (_next_fn) {

      return _next_fn.call(
        this, _validate_validations(_input, _inputs, _field)
      );
    }

  ], function (_err, _rv) {

    /* Final step:
     *   Propagate either an error or the final result. */

    if (_err) {
      return _fn.call(this, _err);
    }

    /* Success */
    return _fn.call(this, _rv);
  });

  return this;
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
var _validate_validations = function (_input, _inputs, _field) {

  var rv = {};
  var validations = _field.validations;

  /* Paranoia: should be normalized */
  if (util.is_omitted_value(validations)) {
    return { valid: true };
  }

  /* Build detailed result list:
   *   This list includes pass/fail information for each rule. */

  _.each(validations.javascript, function (_v, _k) {

    var r = _validate_javascript_validation(_input, _inputs, _field, _v);

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
var _validate_javascript_validation = function (_input, _inputs,
                                                _field, _validation, _fn) {

  var rv = _evaluate_expression(_validation, _input, _inputs, _field);

  if (!rv.success) {
    return {
      valid: false, validation: _validation,
      error: 'Scripted validation rule encountered an error'
    };
  }

  if (!rv.result) {
    return {
      valid: false, validation: _validation,
      error: 'Value does not meet validation constraint(s)'
    };
  }

  return { valid: true };
};


/**
 * @name _evaluate_expression
 *    Evaluate a javascript expression with context. Returns an 
 *    object with the `result` of the expression, a boolean `success` 
 *    property, and an optional `exception` property.
 */
var _evaluate_expression = function (_expression, _input, _inputs, _field) {

  return util.exec(
    'return ' + _expression, 
      { input: _input, inputs: _inputs, field: _field }, this
  );
}


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
var _validate_conditions = function (_input, _inputs, _field, _fn) {

  var rv = {};
  var conditions = _field.conditions;

  /* Paranoia: should be normalized */
  if (util.is_omitted_value(conditions)) {
    return _fn.call(this, { valid: true, skipped: false });
  }

  /* Build detailed result list:
   *   This list includes pass/fail information for each condition. */
  _.each(conditions.javascript, function (_v, _k) {

    var r = _validate_javascript_condition(_input, _inputs, _field, _v);

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
var _validate_javascript_condition = function (_input, _inputs,
                                               _field, _condition) {

  var rv = _evaluate_expression(_condition, _input, _inputs, _field);

  if (!rv.success) {
    return {
      valid: false, condition: _condition,
      error: 'Scripted condition encountered an error'
    };
  }

  if (rv.result) {
    /* Success: should be skipped */
    return { valid: true, skipped: true };
  }

  /* Success: should not be skipped */
  return { valid: true, skipped: false };
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
 * @name _process_scriptable_property:
 *   For the field property `_name`, evaluate/validate/normalize the
 *   appropriate property in `_field` if (and only if) it contains a
 *   script instruction. A script instruction is an object with a
 *   single `javascript` property inside of it; it contains executable
 *   code that returns the intended property value. Script actions
 *   have access to the entire set of input fields in `_inputs`, and
 *   thus can produce property values that depend upon the value of
 *   one or more other fields. This function invokes `_fn` with a
 *   single result object for an argument. The `field` property of
 *   this result object contains a rewritten deep-cloned copy of the
 *   original field, with the `_property` property set to the script
 *   fragment's result.
 */
var _process_scriptable_property = function (_property, _input,
                                             _field, _inputs, _fn) {

  var field = clone(_field);
  var value = field[_property];

  /* Compare against whitelist */
  if (!_supported_scriptable_properties[_property]) {
    return _fn.call(this, {
      valid: false, updated: false, property: _property,
      error: 'Property does not support script evaluation'
    });
  }

  /* Check for script fragment */
  if (!util.is_script_directive(value)) {
    return _fn.call(this, {
      valid: true, updated: false, field: field
    });
  }

  /* Execute script fragment */
  var rv = _evaluate_expression(
    value.javascript, _input, _inputs, field
  );

  if (!rv.success) {
    return _fn.call(this, {
      valid: false, updated: false, property: _property,
      error: 'Error raised while evaluating scripted property'
    });
  }

  /* Merge rewritten property */
  field[_property] = rv.result;

  var validate_fn = [ 'validate', _property, 'property' ].join('_');
  var normalize_fn = [ 'normalize', _property, 'property' ].join('_');

  /* Validate return value */
  validator[validate_fn](field, {}, function (_rv) {

    if (!_rv.valid) {
      return _fn.call(this, {
        valid: false,
        detail: _rv, updated: false, property: _property,
        error: 'Scripted property returned an invalid value'
      });
    }

    /* Normalize return value */
    return _fn.call(this, {
      valid: true, updated: true,
      field: normalizer[normalize_fn](field, {})
    });
  });

  return this;
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

  async.eachSeries(

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

          /* Global validity */
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

  return this;
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
  
  var options = (_options || {});

  async.waterfall([

    /* Step one: Literalize */
    function (_next_fn) {

      /* Process script fragment if necessary:
       *   If there isn't one, this yields `_field.required`. */

      _process_scriptable_property(
        'required', _input, _field, _inputs, function (_rv) {
          util.async_error_check(this, _rv, _next_fn, true);
        }
      );
    },

    /* Step two: Handle permitted field omission */
    function (_rv, _next_fn) {

      /* Use literal value */
      var required = _rv.field.required;

      /* Special case:
       *   Don't allow omission if `force_required` is on. */

      if (options.force_required) {
        required = true;
      }

      /* Special case:
       *   The empty string counts as an omitted value. */

      var is_empty_string = (
        (_field.type == 'string' && _input === '')
      );

      /* General rule:
       *   If the value isn't required and has been omitted, then
       *   we've skipped a non-required field and everything's okay.
       *   Pass an error object so that we skip the remaining steps. */

      if (!required && (is_empty_string || util.is_omitted_value(_input))) {
        return _next_fn.call(this, { valid: true, omitted: true });
      }

      return _next_fn.call(this);
    },

    /* Step three: Process conditions */
    function (_next_fn) {

      return _validate_conditions(_input, _inputs, _field, function (_r) {
        return util.async_error_check(this, _r, _next_fn, true);
      });
    },

    /* Step four: Process repetition */
    function (_rv, _next_fn) {

      /* Immediate success for skipped fields */
      if (_rv.skipped) {
        return _next_fn.call(this, null, _rv);
      }

      /* Handle repetition */
      if (_field.repeat) {
        return _validate_any_repeated(_input, _field, function (_r) {
          return util.async_error_check(this, _r, _next_fn, true);
        });
      }

      /* Otherwise: handle non-repeating field */
      return _validate_any(_input, _field, function (_r) {
        return util.async_error_check(this, _r, _next_fn, true);
      });
    }

  ], function (_err, _rv) {

    /* Final step:
     *   Perform in-common validation for simple fields. */

    if (_err) {
      return _fn.call(this, _err);
    }

    var is_simple_field = (
      _rv.valid && !_rv.skipped && !_rv.omitted &&
        !_field.repeat && _field.type !== 'fields'
    );

    if (is_simple_field) {
      return _validate_common(_input, _inputs, _field, _fn);
    }

    /* Success */
    return _fn.call(this, _rv);
  });

  return this;
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
 * @name validate:
 *   Validate the array of form inputs in `_inputs` against the
 *   array of forms provided in `_forms`. For a given form at
 *   offset `i` in `_forms`, `_inputs[i]` is validates against
 *   `_forms[i]`. Inputs without a corresponding form will not
 *   be examined, and processing will continue through to the
 *   end whether or not errors are encountered. When validation
 *   is finished, `_fn` is invoked with a single result object as
 *   an argument.
 */
exports.validate = function (_forms, _inputs, _fn) {

  var i = 0;
  var self = this;
  var rv = { valid: true, detail: [] };

  /* For every form, asynchronously */
  async.eachSeries(

    /* Arguments */
    _forms,

    /* Item handler */
    function (_form, _next_fn) {

      exports.validate_all(
        _inputs[i++], _form.fields, function (_r) {

          if (!_r.valid) {
            rv.valid = false;
          }

          rv.detail.push(_r);
          _next_fn.call(self);
        }
      );
    },

    /* Completion function */
    function (_err) {
      _fn.call(self, rv);
    }
  );

  return this;
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
 * @name validate_string:
 *   Validate input for a field of type `string`.
 */
exports.validate_string = function (_input, _field, _fn) {

  if (!_.isString(_input) || _input === '') {
    return _fn.call(this, {
      valid: false,
      error: 'Value must be a single plain-text string'
    });
  }

  return _fn.call(this, { valid: true });
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

  return _fn.call(this, { valid: true });
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

  return _fn.call(this, { valid: true });
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

  return _fn.call(this, { valid: true });
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

  return _fn.call(this, { valid: true });
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

  return _fn.call(this, { valid: true });
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

  return _fn.call(this, { valid: true });
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

  return _fn.call(this, { valid: true });
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
    return _fn.call(this, { valid: true });
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

    return _fn.call(this, { valid: true });
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
  
  return _fn.call(this, { valid: true });
};


/**
 * @name validate_email:
 *   Validate input for a field of type `email`. This type
 *   represents a single e-mail address as outlined in RFC
 *   5321 and RFC 5322.
 */
exports.validate_email = function (_input, _field, _fn) {

  if (!node_validator.isEmail(_input)) {

    return _fn.call(this, {
      valid: false,
      error: 'Value must be a valid email address'
    });
  }

  return _fn.call(this, { valid: true });
};


/* vim: set ai ts=8 sts=2 sw=2 expandtab: */
