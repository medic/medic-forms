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
      valid: false, duplicate: id,
      error: 'Duplicate field identifier'
    };
  }

  /* Mark visited */
  _map[id] = _field;

  /* Success */
  return { valid: true };
};


/**
 * @name _validate_selection_list:
 *   Validate all selection list items for a particular field.
 */
var _validate_selection_list = function (_field, _map) {

  var map = {};
  var items = _field.items;

  if (_field.type != 'select' && !util.is_omitted_value(items)) {
    return {
      valid: false,
      error: 'Selection list not allowed for this field type'
    };
  }

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
          error: 'Field definition must be a plain object'
        }));
      }

      /* Properties are scriptable */
      var o = { is_scriptable: true };

      /* Per-field validation steps */
      return async.waterfall([

        /* Step one: General properties */
        function (_f) {
          return _validate_field(map, _field, function (_rv) {
            return util.async_error_check(this, _rv, _f);
          });
        },

        /* Step two: Default value */
        function (_f) {
          return exports.validate_default_property(
            _field, o, function (_rv) {
              return util.async_error_check(this, _rv, _f);
            }
          );
        },

        /* Step three: Recursively embedded fields */
        function (_f) {
          return _validate_recursive_field(
            map, _field, context, function (_rv) {
              return util.async_error_check(this, _rv, _f);
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
      return util.async_final(this, _fn, _err);
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

  /* Script directives allowed */
  var o = { is_scriptable: true };

  /* Run async validations */
  return async.waterfall([

    function (_next_fn) {
      exports.validate_items_property(_field, o, function (_rv) {
        return util.async_error_check(this, _rv, _next_fn);
      });
    },
    function (_next_fn) {
      exports.validate_range_property(_field, o, function (_rv) {
        return util.async_error_check(this, _rv, _next_fn);
      });
    },

    function (_next_fn) {
      exports.validate_length_property(_field, o, function (_rv) {
        return util.async_error_check(this, _rv, _next_fn);
      });
    },

    function (_next_fn) {
      exports.validate_required_property(_field, o, function (_rv) {
        return util.async_error_check(this, _rv, _next_fn);
      });
    },

    function (_next_fn) {
      exports.validate_repeat_property(_field, o, function (_rv) {
        return util.async_error_check(this, _rv, _next_fn);
      });
    }
  ],

  /* Finished */
  function (_err) {
    return util.async_final(this, _fn, _err);
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
var _validate_generic_range = function (_range, _options, _fn) {

  var options = (_options || {});
  var allow_numeric = !!options.allow_numeric;
  var allow_negative = !!options.allow_negative;

  /* Specifying an upper limit alone is valid */
  if (_is_valid_range_item(_range, allow_numeric)) {
    return _fn.call(this, { valid: true });
  }

  /* Array otherwise */
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

    if (!_is_valid_range_item(_range[i], allow_numeric)) {
      return _fn.call(this, {
        valid: false, ordinal: i,
        error: (
          'Numeric range array must contain only null, boolean, or ' +
            (allow_numeric ? 'numeric' : 'integer') + ' items'
        )
      });
    }

    if (_.isNumber(_range[i]) && !allow_negative && _range[i] < 0) {
      return _fn.call(this, {
        valid: false, ordinal: i,
        error: (
          'Numeric range array must contain only non-negative' +
            (allow_numeric ? 'numbers' : 'integers')
        )
      });
    }
  }

  return _fn.call(this, { valid: true });
};


/**
 * @name validate_repeat_property:
 *   Ensure that the `repeat` property contains an acceptable value.
 *   Within any field, a script directive may be provided in place of a
 *   static `repeat` property; the script directive will be executed if
 *   necessary, and its return value will ultimately be used to
 *   determine whether or not repetition is permitted (and, in some
 *   cases, the allowable number of repetitions). That returned value,
 *   however, may need to be validated and normalized before use;
 *   neither procedure will happen automatically because the JSON
 *   schema validation and normalization steps will have already taken
 *   place. This function provides validation logic for `repeat`
 *   specifiers that are returned from these script directives.
 */
exports.validate_repeat_property = function (_field, _options, _fn) {

  var repeat = _field.repeat;
  var options = (_options || {});

  if (options.is_scriptable && util.is_script_directive(repeat)) {
    return _fn.call(this, { valid: true });
  }

  return _validate_generic_range(repeat, {}, _fn);
};


/**
 * @name validate_default_property:
 *   Ensure that the `default` property contains an acceptable value.
 *   Within any field, a script directive may be provided in place of a
 *   static `default` property
 */
exports.validate_default_property = function (_field, _options, _fn) {

  var default_value = _field.default;
  var options = (_options || {});

  if (options.is_scriptable && util.is_script_directive(default_value)) {
    return _fn.call(this, { valid: true });
  }

  return _validate_default_property(_field, _fn);
};


/**
 * @name validate_length_property:
 *   Ensure that the `length` property contains an acceptable value.
 *   Within any field, a script directive may be provided in place of a
 *   static `length` property. See `validate_repeat_property` for more
 *   information about this usage mode.
 */
exports.validate_length_property = function (_field, _options, _fn) {

  var length = _field.length;
  var options = (_options || {});

  if (options.is_scriptable && util.is_script_directive(length)) {
    return _fn.call(this, { valid: true });
  }

  return _validate_generic_range(length, {}, _fn);
};


/**
 * @name validate_range_property:
 *   Ensure that the `range` property contains an acceptable value.
 *   Within any field, a script directive may be provided in place of a
 *   static `range` property. See `validate_repeat_property` for more
 *   information about this usage mode.
 */
exports.validate_range_property = function (_field, _options, _fn) {

  var range = _field.range;
  var options = (_options || {});

  if (options.is_scriptable && util.is_script_directive(range)) {
    return _fn.call(this, { valid: true });
  }

  var o = {
    allow_negative: true,
    allow_numeric: (_field.type == 'number')
  };

  return _validate_generic_range(range, o, _fn);
};


/**
 * @name validate_required_property:
 *   Within any field, a script directive may be provided in place of a
 *   static `required` property. See `validate_repeat_property` for more
 *   information about this usage mode.
 */
exports.validate_required_property = function (_field, _options, _fn) {

  var required = _field.required;
  var options = (_options || {});

  if (options.is_scriptable && util.is_script_directive(required)) {
    return _fn.call(this, { valid: true });
  }

  return _fn.call(this, {
    valid: util.is_omitted_value(required)
  });
};


/**

 */
exports.validate_conditions_property = function (_field, _fields, _fn) {

/*  
  TODO fix this
  TODO document
  TODO call it

  var ids = _.pluck(_fields, 'id');

  if (_field.conditions && _field.conditions.structured) {
    _.every(_.keys(_field.conditions.structured), function(key) {
      return _.contains(ids, key);
    });
  }
  var conditions = _field.conditions;
  var options = (_options || {});

  if (options.is_scriptable && util.is_script_directive(required)) {
    return _fn.call(this, { valid: true });
  }*/

  return _fn.call(this, {
    valid: true
  });
};


/**
 * @name validate_items_property:
 *   Within any field of type `select`, a script directive
 *   may be provided in place of a static `items` property.
 *   See `validate_repeat_property` for more information about
 *   this usage mode.
 */
exports.validate_items_property = function (_field, _options, _fn) {

  var map = {};
  var items = _field.items;
  var options = (_options || {});

  if (util.is_omitted_value(items)) {
    return _fn.call(this, { valid: true });
  }

  if (options.is_scriptable && util.is_script_directive(items)) {
    return _fn.call(this, { valid: true });
  }

  return _fn.call(this, _validate_selection_list(_field, map));
};


/* vim: set ai ts=8 sts=2 sw=2 expandtab: */
