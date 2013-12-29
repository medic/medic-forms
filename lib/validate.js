
var _ = require('underscore');

/**
 * @name _validate_field_names:
 *   Validate a single array of fields, recurring if necessary.
 *   See the exported function below for more information.
 */
var _validate_field_names = function (_map, _fields, _context) {

  var _context = (_context || []);

  for (var i = 0, len = _fields.length; i < len; ++i) {

    var field = _fields[i];

    if (!_.isObject(field)) {
      return {
        valid: false,
        reason: 'Field at offset ' + i + ' is not an object'
      };
    }

    if ((field.id || '').length <= 0) {
      return {
        valid: false,
        reason: 'Field at offset ' + i + ' is missing `id` property'
      };
    }

    var id = field.id;

    if (_map[id]) {
      return {
        valid: false,
        reason: 'Duplicate field identifier `' + id + '` at offset ' + i
      };
    }

    _map[id] = field;
    context.push(id);

    var subfields = field.fields;

    /* Recursive case */
    if (field.type == 'fields' && _.isArray(subfields)) {
      var rv = _validate_field_names(subfields, context);

      if (!rv.valid) {
        return rv;
      }
    }
  }

  return { valid: true };
};

/**
 * @name validate_field_names:
 *   Perform additional form validation steps that cannot be performed
 *   by the JSON schema implementation. This should be run *after* the
 *   schema validation step -- however, out of sheer paranoia, many of
 *   the schema-enforced constraints are double-checked here.
 */
exports.validate_field_names = function (_forms) {

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

    var rv = _validate_field_names(map, form.fields);

    if (!rv.valid) {
      rv.form = i;
      return rv;
    }
  }

  return { valid: true };
};

