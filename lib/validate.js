
var _ = require('underscore');

/**
 * @name _validate_fieldset_identifiers:
 *   Validate a single array of fields, recurring if necessary.
 *   See the exported function below for more information.
 */
var _validate_fieldset_identifiers = function (_map, _fields, _context) {

  var context = (_context || []);

  for (var i = 0, len = _fields.length; i < len; ++i) {

    var field = _fields[i];

    if (!_.isObject(field)) {
      return {
        valid: false, context: context,
        reason: 'Field at offset ' + i + ' is not an object'
      };
    }

    if ((field.id || '').length <= 0) {
      return {
        valid: false, context: context,
        reason: 'Field at offset ' + i + ' is missing `id` property'
      };
    }

    var id = field.id;

    if (_map[id]) {
      return {
        valid: false, context: context,
        reason: 'Duplicate field identifier `' + id + '` at offset ' + i
      };
    }

    _map[id] = field;
    var subfields = field.fields;

    /* Recursive case */
    if (field.type == 'fields' && _.isArray(subfields)) {

      /* Keep path information */
      context.push(id);

      /* Validate every subfield */
      var rv = _validate_fieldset_identifiers(_map, subfields, context);

      if (!rv.valid) {
        return _.extend(rv, { context: context });
      }
    }
  }

  return { valid: true };
};

/**
 * @name validate_field_identifiers:
 *   One of several functions that performs additional form validation
 *   steps not currently possible using JSON schema. This function ensures
 *   that every field identifier used in `_forms` is unique. This function
 *   *should* be run after the schema validation step -- however, out of
 *   sheer paranoia, many of the schema-enforced constraints are
 *   double-checked here.
 */
exports.validate_field_identifiers = function (_forms) {

  var map = {};

  if (!_.isArray(_forms)) {
    return {
      valid: false,
      reason: 'Top-level collection of forms must be an array'
    };
  }

  for (var i = 0, len = _forms.length; i < len; ++i) {

    var form = _forms[i];

    if (!_.isObject(form)) {
      return {
        valid: false,
        reason: 'Form at offset ' + i + ' is not an object'
      };
    }

    var rv = _validate_fieldset_identifiers(map, form.fields);

    if (!rv.valid) {
      rv.form = i;
      return rv;
    }
  }

  return { valid: true };
};

