
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
 * @name _validate_default_value:
 *   Validate the default value provided in the `default` property,
 *   if it was supplied. This function ensures that the value supplied
 *   matches the field definition supplied in `_field`.  This function
 *   *is* asynchronous because it relies upon the (asynchronous) input
 *   validation functions exposed by the `input` module.
 */
var _validate_default_value = function (_field, _fn) {

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

      map[key] = true;
    }
  }

  return { valid: true };
};


/**
 * @name _extend_result_object:
 *   A helper function for `_validate_fieldset`. Extends the
 *   error object in `_rv` with useful context information.
 */
var _extend_result_object = function (_field, _offset, _context, _rv) {

  return _.extend(_rv, { 
    field: (_field || {}).id,
    offset: (_offset || 0), context: (_context || [])
  });
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

  map.field = (map.field || {});
  map.select = (map.select || {});

  /* For each field:
   *   Validate forms asynchronously but not concurrently. */

  return async.eachSeries(

    /* Arguments */
    _fields,

    /* Per-item function */
    function (_field, _next_fn) {

      /* Paranoia: Fields are objects */
      if (!util.is_plain_object(_field)) {
        return _next_fn.call(
          this, _extend_result_object(_field, i, context, {
            valid: false,
            error: 'Field must be an object'
          })
        );
      }

      /* Validate field identifier constraints */
      var rv = _validate_field_identifiers(map.field, _field);
    
      if (!rv.valid) {
        return _next_fn.call(
          this, _extend_result_object(_field, i, context, rv)
        );
      }
    
      /* Validate selection list constraints */
      rv = _validate_select_lists(map.select, _field);
      
      if (!rv.valid) {
        return _next_fn.call(
          this, _extend_result_object(_field, i, context, rv)
        );
      }

      /* Check default value:
       *   This is asynchronous due to the fact that the default
       *   value checking in `_validate_default_value` depends upon the
       *   `input` module's (asynchronous) input validation functions. */

      return _validate_default_value(_field, function (_rv) {

        /* Check result */
        if (!_rv.valid) {
          return _next_fn.call(
            this, _extend_result_object(_field, i, context, _rv)
          );
        }

        /* Handle recursive case */
        if (_is_recursive_field(_field)) {

          /* Keep path information */
          context.push(_field.id);

          /* Validate every subfield */
          return _validate_fieldset(

            /* Arguments */
            map, _field.fields, context,

            /* Completion */
            function (_rv) {

              if (!_rv.valid) {
                return _next_fn.call(
                  this, _extend_result_object(_field, i, context, _rv)
                );
              }

              /* Recursive success */
              return _next_fn.call(this);
            }
          );
        }

        /* Non-recursive success */
        return _next_fn.call(this);
      });
    },

    /* Completion function */
    function (_rv) {

      return _fn.call(this, (_rv || { valid: true }));
    }
  );
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

