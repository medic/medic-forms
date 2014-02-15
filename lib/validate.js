
'use strict';

var async = require('async'),
    _ = require('underscore'),
    util = require('./util.js'),
    input = require('./input.js');


/**
 * @name _is_recursive_field:
 *   Return true if the field `_field` is an embedded set of subfields.
 *   Otherwise, return false. The `_fields` argument must be an object.
 */
var _is_recursive_field = function (_field) {

  return (_field.type == 'fields' && _.isArray(_field.fields));
};


/**
 * @name _validate_default_property:
 *   Validate the default value provided in a field's `default` property,
 *   if it was supplied. This function ensures that the value supplied
 *   matches the field definition supplied in `_field`.  This function
 *   *is* asynchronous because it relies upon the (asynchronous) input
 *   validation functions exposed by the `input` module.
 */
var _validate_default_property = function (_field, _fn) {

  var value = _field.default;

  if (util.is_omitted_value(value)) {
    return _fn.call(this, { valid: true });
  }

  /* Validate default value:
   *   We set the `force_required` option to true; a default value
   *   should *always* be a non-omitted value of the proper type. */

  return input.validate_any(

    /* Arguments, options */
    value, _field, {}, { force_required: true },
   
    /* Completion */
    function (_rv) {

      if (!_rv.valid) {
        return _fn.call(this, {
          valid: false, reason: _rv.error,
          error: 'Default value is invalid input for this field'
        });
      }

      return _fn.call(this, { valid: true });
    }
  );
};


/**
 * @name _validate_field_identifiers:
 *   Validate a single array of fields. See the documentation
 *   for the `_validate_fieldset` method for more information.
 */
var _validate_field_identifiers = function (_map, _field) {

  if (!_.isString(_field.id) || (_field.id || '').length <= 0) {
    return {
      valid: false,
      error: 'Field is missing `id` property'
    };
  }

  var id = _field.id;

  if (_map[id]) {
    return {
      valid: false,
      duplicate: id,
      error: 'Duplicate field identifier'
    };
  }

  /* Mark visited */
  _map[id] = _field;

  /* Success */
  return { valid: true };
};


/**
 * @name _validate_select_lists:
 *   Validate all selection list items for a particular field.
 */
var _validate_select_lists = function (_map, _field) {

  if (_field.type == 'select') {

    var map = {};
    var items = _field.items;

    if (!_.isArray(items)) {
      return {
        valid: false,
        error: 'Selection list must be an array'
      };
    }

    /* For every item in the selection list */
    for (var i = 0, len = items.length; i < len; ++i) {

      var key = false;
      var item = items[i];

      /* Find identifier, if specified */
      if (_.isNumber(item)) {
        key = item;
      } else if (_.isArray(item) && item.length > 0) {
        key = item[0];
      }

      /* Flag if already seen */
      if (map[key]) {
        return {
          valid: false,
          identifier: key,
          error: 'Duplicate identifier in selection list'
        };
      }

      /* Local map */
      map[key] = true;

      /* Result map */
      _map[key] = true;
    }
  }

  return { valid: true };
};


/**
 * @name _validate_fieldset:
 *   One of several functions that performs additional form validation
 *   steps not currently possible using JSON schema. This function
 *   ensures that every field identifier and selection-list item
 *   identifier used in `_fields` is unique, and then checks whether any
 *   specified default values are valid input for the field type
 *   specified, This function *should* be run after the schema
 *   validation step -- however, out of sheer paranoia, many of the
 *   schema-enforced constraints are double-checked here.
 */
var _validate_fieldset = function (_map, _fields, _context, _fn) {

  var i = 0;
  var map = (_map || {});
  var context = (_context || []);

  /* For each field:
   *   Validate forms asynchronously but not concurrently. */

  return async.eachSeries(

    /* Arguments */
    _fields,

    /* Per-item function */
    function (_field, _next_fn) {

      /* Paranoia: Fields are objects */
      if (!util.is_plain_object(_field)) {
        return _next_fn.call(this, _.extend(_err, {
          valid: false,
          offset: i, context: context,
          error: 'Field must be an object'
        }));
      }

      /* Per-field validation steps */
      return async.waterfall([

        /* Step one: General properties */
        function (_f) {
          return _validate_field(
            map, _field, function (_rv) {
              return util.async_error_if_invalid(this, _rv, _f);
            }
          );
        },

        /* Step two: Default value */
        function (_f) {
          return _validate_default_property(
            _field, function (_rv) {
              return util.async_error_if_invalid(this, _rv, _f);
            }
          );
        },

        /* Step three: Recursively embedded fields */
        function (_f) {
          return _validate_recursive_field(
            map, _field, context, function (_rv) {
              return util.async_error_if_invalid(this, _rv, _f);
            }
          );
        }
      ],

      /* End steps */
      function (_err) {

        /* Validation failure?
         *   Add context information and return. */

        if (_err) {
          return _next_fn.call(
            this, _.extend(_err, {
              field: _field.id, offset: i, context: context
            })
          );
        }

        /* Success */
        return _next_fn.call(this);
      });
    },

    /* End iteration */
    function (_err) {
      return _fn.call(this, (_err || { valid: true }));
    }
  );
};


/**
 * @name _validate_recursive_field:
 *   If the field `_field` contains an embedded fieldset (i.e. is of type
 *   `fields` and contains a `fields` property), recursively evaluate each
 *   of the fields contained within it. The `_map` argument should point
 *   to an identifier cache produced by `_validate_field`, and `_context`
 *   (optional) may point to an array of path information to be used by
 *   recursive calls to `_validate_fieldset`. This function is
 *   asynchronous; it calls `_fn` with a single result object when it has
 *   finished validating fields.
 */
var _validate_recursive_field = function (_map, _field, _context, _fn) {

  /* Base case */
  if (!_is_recursive_field(_field)) {
    return _fn.call(this, { valid: true });
  }

  /* Keep path information */
  _context.push(_field.id);

  /* Validate every subfield */
  return _validate_fieldset(_map, _field.fields, _context, _fn);
};


/**
 * @name _validate_field:
 *   Validate all "regular" properties of the field `_field`, and call
 *   `_fn` with a single result object after evaluation is complete.
 *   Validation will stop immediately if an error is encountered. The
 *   `_map` argument should point to an object; it will be used by this
 *   function to keep track of any identifiers that are encountered
 *   during the validation process.
 */
var _validate_field = function (_map, _field, _fn) {

  /* Storage for identifiers */
  _map.field = (_map.field || {});
  _map.select = (_map.select || {});

  /* Field identifier constraints */
  var rv = _validate_field_identifiers(_map.field, _field);

  if (!rv.valid) {
    return _fn.call(this, rv);
  }

  /* Selection list constraints */
  rv = _validate_select_lists(_map.select, _field);
  
  if (!rv.valid) {
    return _fn.call(this, rv);
  }

  /* Run async validations */
  return async.waterfall([

    function (_next_fn) {
      exports.validate_range_property(_field, function (_rv) {
        return util.async_error_if_invalid(this, _rv, _next_fn);
      });
    },

    function (_next_fn) {
      exports.validate_length_property(_field, function (_rv) {
        return util.async_error_if_invalid(this, _rv, _next_fn);
      });
    },

    function (_next_fn) {
      exports.validate_required_property(_field, function (_rv) {
        return util.async_error_if_invalid(this, _rv, _next_fn);
      });
    },

    function (_next_fn) {
      exports.validate_repeat_property(_field, function (_rv) {
        return util.async_error_if_invalid(this, _rv, _next_fn);
      });
    }
  ],
  
  /* Finished */
  function (_err) {
    return _fn.call(this, (_err || { valid: true }));
  });

};


/**
 * @name _track_form_result:
 *   Add the error structure `_error` to _rv, and then call the
 *   continuation `_fn`. This is a syntax convenience function.
 */
var _track_form_result = function (_rv, _fn, _result) {

  _rv.push(_result);
  return _fn.call(this);
};


/**
 * @name validate_all:
 *   Asynchronously invoke `validate` on every form in `_forms`.
 *   Return a top-level result object containing a `valid` indicator
 *   that is set to true if and only if all forms are valid; include
 *   an array of result objects, one for each form in `_forms`, in
 *   the `detail` property of the top-level result object.
 */
exports.validate_all = function (_forms, _fn) {

  var rv = [];

  /* Type check */
  if (!_.isArray(_forms)) {

    return _fn.call(this, {
      valid: false, detail: {},
      error: 'Top-level collection of forms must be an array'
    });
  }

  /* For each form:
   *   Validate forms asynchronously but not concurrently. */

  return async.eachSeries(

    /* Arguments */
    _forms,

    /* Per-item function */
    function (_form, _next_fn) {

      exports.validate(_form, rv, function (_result) {
        return _track_form_result(rv, _next_fn, _result);
      });
    },

    /* Completion function */
    function (_err) {

      /* Determine if all fields were marked valid */
      var valid = util.all_properties_equal(rv, 'valid', true);

      rv = {
        detail: rv,
        valid: util.all_properties_equal(rv, 'valid', true)
      };

      if (!rv.valid) {
        rv.error = 'One or more forms are invalid';
      }

      /* Finished */
      return _fn.call(this, rv);
    }
  );
}


/**
 * @name validate:
 *   Perform a set of additional form validation steps that are
 *   not currently possible using JSON schema -- including, but
 *   not limited to, ensuring uniqueness of `id` fields. This
 *   function *should* be run after the schema validation step;
 *   however, out of sheer paranoia, many of the schema-enforced
 *   constraints are double-checked here. The `_visited_map`
 *   argument should refer to an object that can be used to store
 *   information about form identifiers that have been used.
 */
exports.validate = function (_form, _visited_map, _fn) {

  var fields_map = {};
  var visited_map = (_visited_map || {});

  /* Validate each individual form */
  if (!util.is_plain_object(_form)) {
    return _fn.call(this, {
      valid: false,
      error: 'Form is not an object'
    });
  }

  /* Validate metadata */
  var meta = _form.meta;

  if (!util.is_plain_object(meta)) {
    return _fn.call(this, {
      valid: false, 
      error: 'Form metadata is missing or not an object'
    });
  }

  var id = meta.id;

  if (!_.isString(id) || id.length <= 0) {
    return _fn.call(this, {
      valid: false,
      error: 'Form has a missing or zero-length identifier'
    });
  }

  if (_visited_map[id]) {
    return _fn.call(this, {
      valid: false, id: id,
      error: 'Form has duplicate identifier'
    });
  }

  /* No fields: success */
  if (util.is_omitted_value(_form.fields)) {
    return _fn.call(this, { valid: true });
  }

  /* Validate form fields */
  return _validate_fieldset(
  
    /* Arguments */
    fields_map, _form.fields, false,
      
    /* Completion */
    function (_rv) {
      return _fn.call(this, _.extend(_rv, {
        fields: fields_map
      }));
    }
  );
};


/**
 * @name _is_valid_range_item:
 *   Return true if `_item` is allowed inside of a range specifier.
 *   If `_allow_numeric` is true-like, then items will be allowed to
 *   contain non-integer numbers (i.e. with data to the right of the
 *   decimal point).
 */
var _is_valid_range_item = function (_item, _allow_numeric) {

  if (util.is_omitted_value(_item) || util.is_integer(_item)) {
    return true;
  }

  if (_allow_numeric && _.isNumber(_item)) {
    return true;
  }

  return false;
}


/**
 * @name _validate_generic_range:
 *   Validate a numeric range (used to implement length and/or range
 *   restrictions) without using the JSON schema. This is required
 *   for cases where a script directive is returning a range for us
 *   to use, as the script directive runs after JSON schema validation.
 */
var _validate_generic_range = function (_range,
                                        _allow_numeric,
                                        _allow_negative, _fn) {

  if (_is_valid_range_item(_range, _allow_numeric)) {
    return _fn.call(this, { valid: true });
  }

  if (!_.isArray(_range)) {
    return _fn.call(this, {
      valid: false,
      error: 'Numeric range must be boolean, integer, or array'
    });
  }

  var length = _range.length;

  if (length < 1 || length > 2) {
    return _fn.call(this, {
      valid: false,
      error: 'Numeric range array must contain one or two items'
    });
  }

  for (var i = 0; i < length; ++i) {

    if (!_is_valid_range_item(_range[i], _allow_numeric)) {
      return _fn.call(this, {
        valid: false, ordinal: i,
        error: (
          'Numeric range array must contain only null, boolean, or ' +
            (_allow_numeric ? 'numeric' : 'integer') + ' items'
        )
      });
    }

    if (_.isNumber(_range[i]) && !_allow_negative && _range[i] < 0) {
      return _fn.call(this, {
        valid: false, ordinal: i,
        error: (
          'Numeric range array must contain only non-negative' +
            (_allow_numeric ? 'numbers' : 'integers')
        )
      });
    }
  }

  return _fn.call(this, { valid: true });
};


/**
 * @name validate_repeat_property:
 *   Within any field, a script directive may be provided in place of a
 *   static `repeat` property; the script directive will be executed if
 *   necessary, and its return value will ultimately be used to
 *   determine whether or not repetition is permitted (and, in some
 *   cases, the allowable number range of repetitions). That returned
 *   value, however, may need to be validated and normalized before use;
 *   neither procedure will happen automatically because the JSON
 *   schema validation and normalization steps will have already taken
 *   place. This function provides validation logic for `repeat`
 *   specifiers that are returned from these script directives.
 */
exports.validate_repeat_property = function (_field, _fn) {

  return _validate_generic_range(_field.repeat, false, false, _fn);
};


/**
 * @name validate_default_property:
 *   Within any field, a script directive may be provided in place of a
 *   static `default` property; the script directive will be executed if
 *   necessary, and its return value will ultimately be used as a
 *   default value if one is needed. That returned value, however, may
 *   need to be validated and normalized before use; neither procedure
 *   will happen automatically because the JSON schema validation and
 *   normalization steps will have already taken place. This function
 *   provides validation logic for `default` specifiers that are
 *   returned from these script directives.
 */
exports.validate_default_property = function (_field, _fn) {

  return _validate_default_property(_field, _fn);
};


/**
 * @name validate_length_property:
 *   Within any field, a script directive may be provided in place of a
 *   static `length` property; the script directive will be executed if
 *   necessary, and its return value will ultimately be used as a
 *   length specifier if one is needed. That returned value, however, may
 *   need to be validated and normalized before use; neither procedure
 *   will happen automatically because the JSON schema validation and
 *   normalization steps will have already taken place. This function
 *   provides validation logic for `length` specifiers that are
 *   returned from these script directives.
 */
exports.validate_length_property = function (_field, _fn) {

  return _validate_generic_range(_field.repeat, false, false, _fn);
};


/**
 * @name validate_range_property:
 *   Within any field, a script directive may be provided in place of a
 *   static `range` property; the script directive will be executed if
 *   necessary, and its return value will ultimately be used as a
 *   range specifier if one is needed. That returned value, however, may
 *   need to be validated and normalized before use; neither procedure
 *   will happen automatically because the JSON schema validation and
 *   normalization steps will have already taken place. This function
 *   provides validation logic for `range` specifiers that are
 *   returned from these script directives.
 */
exports.validate_range_property = function (_field, _fn) {

  return _validate_generic_range(
    _field.repeat, (_field.type == 'number'), true, _fn
  );
};


/**
 * @name validate_required_property:
 *   Within any field, a script directive may be provided in place of a
 *   static `required` property; the script directive will be executed
 *   if necessary, and its return value will ultimately be used to
 *   determine whether or not input is required. That returned value,
 *   however, may need to be validated and normalized before use;
 *   neither procedure will happen automatically because the JSON
 *   schema validation and normalization steps will have already taken
 *   place. This function provides validation logic for `required`
 *   specifiers that are returned from these script directives.
 */
exports.validate_required_property = function (_field, _fn) {

  return _fn.call(this, {
    valid: util.is_omitted_value(_field.required)
  });
};
