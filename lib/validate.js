
var _ = require('underscore'),
    jsdump = require('jsDump'),
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
 *   if it was supplied. This function ensures that the value
 *   supplied matches the field definition supplied in `_field`.
 */
var _validate_default_value = function (_field) {

  var value = _field.default;

  if (util.is_omitted_value(value)) {
    return { valid: true };
  }

  /* Validate default value, forcing `required` to true */
  var rv = input.validate_any(value, _field, true);

  if (!rv.valid) {
    return {
      valid: false, reason: rv.error,
      error: 'Default value is invalid input for this field'
    };
  }

  return { valid: true };
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
 * @name validate_fieldset:
 *   One of several functions that performs additional form validation
 *   steps not currently possible using JSON schema. This function
 *   ensures that every field identifier and selection-list item
 *   identifier used in `_fields` is unique, and then checks whether any
 *   specified default values are valid input for the field type
 *   specified, This function *should* be run after the schema
 *   validation step -- however, out of sheer paranoia, many of the
 *   schema-enforced constraints are double-checked here.
 */
var _validate_fieldset = function (_map, _fields, _context)
{

  var map = (_map || {});
  var context = (_context || []);

  map.field = (map.field || {});
  map.select = (map.select || {});

  for (var i = 0, len = _fields.length; i < len; ++i) {

    var field = _fields[i];

    /* Paranoia: Fields are objects */
    if (!_.isObject(field)) {
      return _extend_result_object(field, i, context, {
        valid: false,
        error: 'Field must be an object'
      });
    }

    /* Validate field identifier constraints */
    var rv = _validate_field_identifiers(map.field, field);
  
    if (!rv.valid) {
      return _extend_result_object(field, i, context, rv);
    }
  
    /* Validate selection list constraints */
    rv = _validate_select_lists(map.select, field);
    
    if (!rv.valid) {
      return _extend_result_object(field, i, context, rv);
    }
  
    /* Ensure default value, if specified, is valid input */
    rv = _validate_default_value(field);
    
    if (!rv.valid) {
      return _extend_result_object(field, i, context, rv);
    }
    /* Recursive case */
    if (_is_recursive_field(field)) {

      /* Keep path information */
      context.push(field.id);

      /* Validate every subfield */
      var rv = _validate_fieldset(map, field.fields, context);

      if (!rv.valid) {
        return _extend_result_object(field, i, context, rv);
      }
    }
  }

  return { valid: true };
};

/**
 * @name validate_forms:
 *   Perform a set of additional form validation steps that are not
 *   currently possible using JSON schema. This function ensures that
 *   every form identifier used in the `_forms` array is unique. This
 *   function *should* be run after the schema validation step --
 *   however, out of sheer paranoia, many of the schema-enforced
 *   constraints are double-checked here.
 */
exports.validate_forms = function (_forms) {

  var forms_map = {};
  var fields_map = {};

  if (!_.isArray(_forms)) {
    return {
      valid: false,
      error: 'Top-level collection of forms must be an array'
    };
  }

  /* Validate identifiers for each individual form */
  for (var i = 0, len = _forms.length; i < len; ++i) {

    var form = _forms[i];

    if (!_.isObject(form)) {
      return {
        valid: false, form: i,
        error: 'Form is not an object'
      };
    }

    var meta = form.meta;

    if (_.isUndefined(meta)) {
      continue;
    }

    if (!_.isObject(meta)) {
      return {
        valid: false, form: i,
        error: 'Form metadata is missing or not an object'
      };
    }

    var id = meta.id;

    if (!_.isString(id) || id.length <= 0) {
      return {
        valid: false, form: i,
        error: 'Form has a missing or zero-length identifier'
      };
    }

    if (forms_map[id] == id) {
      return {
        valid: false, form: i,
        error: 'Form has duplicate identifier `' + id + '`'
      };
    }

    forms_map[id] = id;
  }

  /* Validate each individual field */
  if (!_.isUndefined(form.fields)) {
    var rv = _validate_fieldset(fields_map, form.fields);

    if (!rv.valid) {
      return _.extend(rv, { form: i });
    }
  }

  return { valid: true };
}

