
var _ = require('underscore'),
    jsdump = require('jsDump'),
    util = require('./util.js');

/**
 * @name _clamp_range:
 */
var _clamp_range = function (_value, _is_count) {
 
  if (_is_count) {
    return Math.max(0, Math.floor(_value));
  }

  return _value;
}


/**
 * @name _normalize_generic_range:
 *   Normalize a numeric range, consisting of either (a) an integer
 *   value, or (b) an array containing either one numeric item or two
 *   numeric items, or (c) any other value. If `_is_count` is
 *   true-like, this function will assume that the minimum value is
 *   zero; otherwise, the minimum value is assumed to be -Infinity.
 *   For case (c) above, a default value of [ 0, 0 ] is returned if
 *   `_is_count` is true, or [ -Infinity, Infinity ] if false. See
 *   the normalization unit tests for more information on behavior.
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
    _range = [
      default_lower, _clamp_range(_range, _is_count)
    ];

  } else if (_.isArray(_range)) {

    /* Array/tuple form */
    var r = _range.slice(0, 2);

    switch (r.length) {
      case 1:
        if (util.is_omitted_value(r[0])) {
          r = default_range;
        } else {
          r = [ r[0], Infinity ];
        }
        break;
      case 2:
        if (util.is_omitted_value(r[0]) && util.is_omitted_value(r[1])) {
          r = default_range;
        } else {
          r = [ r[0], (util.is_omitted_value(r[1]) ? Infinity : r[1]) ];
        }
        break;
      default:
        r = default_range;
        break;
    }

    for (var i = 0; i < 2; ++i) {
      _range[i] = (
        util.is_omitted_value(r[i]) ?
          default_lower : _clamp_range(r[i], _is_count)
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
 *   Convert the per-field `repeat` property from any of the accepted
 *   formats to the preferred two-element array form. The lower bound
 *   will never be less than zero; the upper bound may be as high as
 *   Infinity.
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

  /* Maintain consistency */
  if (repeat) {

    /* Force lower bound to one if required */
    if (_field.required && repeat[0] <= 0) {
      repeat[0] = 1;
    }

    /* Make required if lower bound is non-zero */
    if (repeat[0] > 0) {
      _field.required = true;
    }
  }

  /* Update field */
  _field.repeat = repeat;
};


/**
 * @name _normalize_range_property:
 *   Convert the per-field `range` property from any of the accepted
 *   formats to the preferred two-element array form. The output
 *   array's lower bound is -Infinity; its upper bound is Infinity.
 */
var _normalize_range_property = function (_field) {

  _field.range = _normalize_generic_range(_field.range);
  return _field;
};


/**
 * @name _normalize_length_property:
 *   Convert the per-field `range` property from any of the accepted
 *   formats to the preferred two-element array form. The output
 *   array's lower bound is zero; its upper bound is Infinity.
 */
var _normalize_length_property = function (_field) {

  var length = _field.length;
  length = _normalize_generic_range(length, true);

  /* Reduce all-zeroes to unbounded length */
  if (length[0] == 0 && length[1] == 0) {
    length = [ 0, Infinity ];
  }

  if (!_field.repeat && _field.required) {
    length[0] = 1;
  }

  _field.length = length;
  return _field;
};


/**
 * @name _normalize_required_property:
 *   Ensure a `required` property both exists and is boolean.
 */
var _normalize_required_property = function (_field) {

  if (_.isUndefined(_field.required)) {
    _field.required = false;
  }

  _field.required = !!_field.required;
  return _field;
};

/**
 * @name _normalize_identifiers:
 *   Ensure all identifiers are both present and represented as
 *   localized objects with language-code keys and string values.
 */
var _normalize_identifiers = function (_object, _default_language) {

  var map = { name: 'id', description: 'name' };

  for (var k in map) {
    if (util.is_omitted_value(_object[k])) {
      _object[k] = _object[map[k]];
    }
  }

  for (var k in map) {
    _object[k] = _normalize_l10n_string(
      _object[k], _default_language
    );
  }

  /* Infer identifiers:
      If default-language identifiers are missing, try to infer them. */

  for (var k in map) {
    if (util.is_omitted_value(_object[k][_default_language])) {
      _object[k][_default_language] =
        _denormalize_l10n_string(_object[map[k]], _default_language);
    }
  }

  return _object;
};


/**
 * @name _normalize_selection_list:
 *   Ensure that selection list items are represented as an array,
 *   and that the array contains zero or more two-element arrays
 *   representing the list of possible values. The first element
 *   of each selection list item is either a number or a string
 *   representing its value; the second element of each item is
 *   a localization object (containing two-character language codes
 *   for keys, and utf-8 strings for values).
 */
var _normalize_selection_list = function (_field, _default_language) {

  var n = 1;
  var map = {};

  if (_field.type != 'select') {
    return _field;
  }

  var items = _field.items;
  var identifier_limit = 1048576;

  /* Default value: no items */
  if (util.is_omitted_value(items)) {
    _field.items = [];
    return _field;
  }

  /* Rewrite selection list items */
  for (var i = 0, len = items.length; i < len; ++i) {

    var item = items[i];

    /* Convert to array form */
    if (_.isNumber(item)) {
      item = [ item, item.toString(10) ];
    } else if (_.isArray(item)) {
      map[item[0]] = true;
      item = util.pad(item, 2).slice(0, 2);
    } else if (_.isString(item) || _.isObject(item)) {
      item = [ false, item ];
    } else {
      continue;
    }

    /* Commit result */
    _field.items[i] = item;
  }

  /* Create map of already-specified identifiers */
  for (var i = 0, len = items.length; i < len; ++i) {
    if (!util.is_omitted_value(items[i])) {
      map[items[i]] = true;
    }
  }

  /* Generate identifiers where necessary*/
  for (var i = 0, len = items.length; i < len; ++i) {

    var item = items[i];

    /* Generate identifiers if needed */
    if (util.is_omitted_value(item[0])) {

      /* Find available identifier */
      for (; map[n]; ++n) {
        if (n > identifier_limit) {
          continue;
        }
      }

      /* Apply identifier */
      item[0] = n;

      /* Mark as used */
      map[n] = true;
    }

    /* Normalize label */
    item[1] = _normalize_l10n_string(item[1], _default_language);

    /* Commit result */
    _field.items[i] = item;
  }

  return _field;
};


/**
 * @name _normalize_l10n_string:
 *   Ensure that `_input` is an object containing localized strings.
 *   Property names are two-character language codes; the value for
 *   each property is a utf-8 string.
 */
var _normalize_l10n_string = function (_input, _default_language) {

  var rv = {};

  if (_.isString(_input)) {
    rv[_default_language] = _input;
  } else if (_.isObject(_input)) {
    rv = _input;
  }

  return rv;
};


/**
 * @name _denormalize_l10n_string:
 *   Return a bare-string version of the localized string object
 *   provided in `_input`, given a specific two-character language
 *   code in `_default_language`. Return `_input` unmodified if it
 *   is already a bare string.
 */
var _denormalize_l10n_string = function (_input, _default_language) {

  var rv = false;

  if (_.isString(_input)) {
    rv = _input;
  } else if (_.isObject(_input)) {
    rv = _input[_default_language];
  }

  return rv;
};

/**
 * @name _normalize_fieldset:
 *   Normalize a single array of fields, recurring if necessary.
 *   This code assumes that it's operating on an already-validated
 *   form definition; failure to validate the form before passing
 *   it in to the normalization code is an error, and will likely
 *   blow up. See the exported function below for more information.
 */
var _normalize_fieldset = function (_fields, _default_language) {

  for (var i = 0, len = _fields.length; i < len; ++i) {

    var field = _fields[i];

    /* Paranoia: validation should ensure this */
    if (!_.isObject(field)) {
      continue;
    }

    _normalize_identifiers(field, _default_language);
    _normalize_selection_list(field, _default_language);

    _normalize_repeat_property(field);
    _normalize_range_property(field);
    _normalize_length_property(field);
    _normalize_required_property(field);

    /* Recursive case */
    var subfields = field.fields;

    if (subfields) {
      _normalize_fieldset(subfields, _default_language);
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
    var meta = (form.meta || {});
    var language = (meta.language || 'un');

    if (meta) {
      _normalize_identifiers(meta, language);
    }

    if (form.fields) {
      _normalize_fieldset(form.fields, language);
    }
  }
};


