
var _ = require('underscore'),
    jsdump = require('jsDump');


/**
 * @name _is_recursive_field:
 *   Return true if the field `_field` is an embedded set of subfields.
 *   Otherwise, return false. The `_fields` argument must be an object.
 */
var _is_recursive_field = function (_field) {

    return (_field.type == 'fields' && _.isArray(_field.fields));
};

/**
 * @name _validate_field_identifiers:
 *   Validate a single array of fields. See the documentation for
 *   `_validate_fieldset_identifiers` for more information.
 */
var _validate_field_identifiers = function (_map, _field) {

  if (!_.isString(_field.id) || (_field.id || '').length <= 0) {
    return {
      valid: false,
      reason: 'Field is missing `id` property'
    };
  }

  var id = _field.id;

  if (_map[id]) {
    return {
      valid: false,
      duplicate: id,
      reason: 'Duplicate field identifier'
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
        reason: 'Selection list must be an array'
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
          reason: 'Duplicate identifier in selection list'
        };
      }

      map[key] = true;
    }
  }

  return { valid: true };
};

/**
 * @name _extend_field_error:
 *   A helper function for `_validate_fieldset_identifiers`. Extend the
 *   error object in `_rv` with useful context information.
 */
var _extend_field_error = function (_field, _context, _offset, _rv) {

  return _.extend(_rv, { 
    field: (_field || {}).id,
    offset: _offset, context: _context
  });
};

/**
 * @name validate_fieldset_identifiers:
 *   One of several functions that performs additional form validation
 *   steps not currently possible using JSON schema. This function ensures
 *   that every field identifier used in `_forms` is unique. This function
 *   *should* be run after the schema validation step -- however, out of
 *   sheer paranoia, many of the schema-enforced constraints are
 *   double-checked here.
 */
var _validate_fieldset_identifiers = function (_map, _fields, _context) {

  var map = (_map || {});
  var context = (_context || []);

  map.field = (map.field || {});
  map.select = (map.select || {});

  for (var i = 0, len = _fields.length; i < len; ++i) {

    var field = _fields[i];

    /* Paranoia: Fields are objects */
    if (!_.isObject(field)) {
      return _extend_field_error(field, context, i, {
        valid: false,
        reason: 'Field must be an object'
      });
    }

    /* Validate field identifier constraints */
    var rv = _validate_field_identifiers(map.field, field);
  
    if (!rv.valid) {
      return _extend_field_error(field, context, i, rv);
    }
  
    /* Validate selection list constraints */
    rv = _validate_select_lists(map.select, field);
    
    if (!rv.valid) {
      return _extend_field_error(field, context, i, rv);
    }

    /* Recursive case */
    if (_is_recursive_field(field)) {

      /* Keep path information */
      context.push(field.id);

      /* Validate every subfield */
      var rv = _validate_fieldset_identifiers(map, field.fields, context);

      if (!rv.valid) {
        return _extend_field_error(field, context, i, rv);
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
      reason: 'Top-level collection of forms must be an array'
    };
  }

  /* Validate identifiers for each individual form */
  for (var i = 0, len = _forms.length; i < len; ++i) {

    var form = _forms[i];

    if (!_.isObject(form)) {
      return {
        valid: false, form: i,
        reason: 'Form is not an object'
      };
    }

    var meta = form.meta;

    if (_.isUndefined(meta)) {
      continue;
    }

    if (!_.isObject(meta)) {
      return {
        valid: false, form: i,
        reason: 'Form metadata is missing or not an object'
      };
    }

    var id = meta.id;

    if (!_.isString(id) || id.length <= 0) {
      return {
        valid: false, form: i,
        reason: 'Form has a missing or zero-length identifier'
      };
    }

    if (forms_map[id] == id) {
      return {
        valid: false, form: i,
        reason: 'Form has duplicate identifier `' + id + '`'
      };
    }

    forms_map[id] = id;
  }

  /* Validate each individual field */
  if (!_.isUndefined(form.fields)) {
    var rv = _validate_fieldset_identifiers(fields_map, form.fields);

    if (!rv.valid) {
      return _.extend(rv, { form: i });
    }
  }

  return { valid: true };
}

