
var _ = require('underscore');

/**
 * @name _is_omitted:
 */
var _is_omitted = function (_value) {
  
  return (
    _.isBoolean(_value) ||
      _.isNull(_value) || _.isUndefined(_value)
  );
}


/**
 * @name _integerify:
 */
var _integerify = function (_value) {
  
  return Math.max(0, Math.floor(_value));
}


/**
 * @name _normalize_generic_range:
 */
var _normalize_generic_range = function (_range, _is_count) {

  /* For omitted ranges */
  var default_range = (
    _is_count ? [ 0, 0 ] : [ -Infinity, Infinity ]
  );

  /* For omitted lower bound */
  var default_lower = (
    _is_count ? 0 : -Infinity
  );

  if (_.isNumber(_range)) {

    /* Numeric upper-limit */
    _range = [ default_lower, _integerify(_range) ];

  } else if (_.isArray(_range)) {

    /* Array/tuple form */
    var r = _range.slice(0, 2);

    switch (r.length) {
      case 1:
        if (_is_omitted(r[0])) {
          r = default_range;
        } else {
          r = [ r[0], Infinity ];
        }
        break;
      case 2:
        if (_is_omitted(r[0]) && _is_omitted(r[1])) {
          r = default_range;
        } else {
          r = [ r[0], (_is_omitted(r[1]) ? Infinity : r[1]) ];
        }
        break;
      default:
        r = default_range;
        break;
    }

    for (var i = 0; i < 2; ++i) {
      _range[i] = (
        _is_omitted(r[i]) ? default_lower : _integerify(r[i])
      );
    }

  } else {

    /* Unknown type */
    _range = default_range;
  }

  /* Handle out-of-order arguments */
  if (_range[0] > _range[1]) {
    _range = [ _range[1], _range[0] ];
  }

  return _range;
};


/**
 * @name _normalize_repeat_property:
 */
var _normalize_repeat_property = function (_field) {

  var repeat = _field.repeat;

  /* True for unlimited repetition */
  if (_.isBoolean(repeat)) {

    if (repeat) {
      repeat = [ 0, Infinity ];
    }
  } else {

    /* Normalize to two-element array */
    repeat = _normalize_generic_range(repeat, true);
  }

  /* Reduce all-zeroes to false */
  if (repeat[0] == 0 && repeat[1] == 0) {
    repeat = false;
  }

  /* Be consistent with `required` property */
  if (_field.required && repeat && repeat[0] <= 0) {
    repeat[0] = 1;
  }

  /* Update field */
  _field.repeat = repeat;
};


/**
 * @name _normalize_range_property:
 */
var _normalize_range_property = function (_field) {

  _field.range = _normalize_generic_range(_field.range);
  return _field;
};


/**
 * @name _normalize_length_property:
 */
var _normalize_length_property = function (_field) {

  var length = _field.length;
  length = _normalize_generic_range(length, true);

  /* Reduce all-zeroes to unbounded length */
  if (length[0] == 0 && length[1] == 0) {
    length = [ 0, Infinity ];
  }

  _field.length = length;
  return _field;
};


/**
 * @name _normalize_required_property:
 */
var _normalize_required_property = function (_field) {

  if (_.isUndefined(_field.required)) {
    _field.required = false;
  }

  return _field;
};


/**
 * @name _normalize_fieldset:
 *   Normalize a single array of fields, recurring if necessary.
 *   This code assumes that it's operating on an already-validated
 *   form definition; failure to validate the form before passing
 *   it in to the normalization code is an error, and will likely
 *   blow up. See the exported function below for more information.
 */
var _normalize_fieldset = function (_fields) {

  for (var i = 0, len = _fields.length; i < len; ++i) {

    var field = _fields[i];

    _normalize_repeat_property(field);
    _normalize_range_property(field);
    _normalize_length_property(field);
    _normalize_required_property(field);

    /* Recursive case */
    var subfields = field.fields;

    if (subfields) {
      _normalize_fieldset(subfields);
    }
  }
};


/**
 * @name normalize_forms:
 *   Normalize a set of forms, ensuring that every field is expressed in
 *   its most-verbose and predictable form. For all output fields: the
 *   `repeat` property is always either `false` or a two-element array
 *   with numeric members; `required` is always a boolean value. For
 *   string-typed output fields, the length property is always a
 *   two-element array. For integer-typed and numeric-typed output
 *   fields, the `range` property is always a two-element array.
 *
 *   This code assumes that it's operating on an already-validated
 *   form definition; failure to validate the form before passing
 *   it in to the normalization code is an error, and will likely
 *   blow up. See the exported function below for more information.
 */
exports.normalize_forms = function (_forms) {

  for (var i = 0, len = _forms.length; i < len; ++i) {

    var form = _forms[i];

    if (form.fields) {
      _normalize_fieldset(form.fields);
    }
  }
};


