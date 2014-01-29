var fs = require('fs'),
    _ = require('underscore'),
    deepEqual = require('deep-equal'),
    util = require('./util'),
    n = require('../lib/normalize'),
    tests = require('./fixtures/compiled');

/**
 * @name compare_partial:
 */
var compare_partial = function (_lhs, _rhs, _properties) {

  var properties = (_properties || []);

  if (properties.length == 0) {
    return deepEqual(_lhs, _rhs);
  } else {
    for (var i = 0, len = _properties.length; i < len; ++i) {
      var k = _properties[i];

      if (!deepEqual(_lhs[k], _rhs[k])) {
        return false;
      }
    }
  }

  return true;
};

/**
 * @name check_fields:
 */
var check_fields = function (_test, _fields,
                             _expected, _properties, _context) {

  var context = (_context || []);

  if (!_.isArray(_expected)) {
    _expected = [ _expected ];
  }

  if (!_.isArray(_fields)) {
    _fields = [ _fields ];
  }

  /* For each checkable object in scope */
  for (var i = 0, len = _expected.length; i < len; ++i) {

    if (_expected[i].type == 'fields') {

      check_fields(
        _test, (_fields[i].fields || []), (_expected[i].fields || []),
          _properties, context.concat([ i ])
      );

    } else {

      var path_text = (
        context.length > 0 ?
          ', along subfield path ' + JSON.stringify(context) : ''
      );

      _test.ok(
        compare_partial(_expected[i], _fields[i], _properties),
        path_text + ': properties ' +
          JSON.stringify(_properties) + ' must match'
      );
    }
  }
};

/**
 * @name _assert
 */
var _assert = function(_test, _fixture, _value, _scope) {

  var from = _fixture.from, to = _fixture.to;

  _test.ok(_.isObject(to), 'must have `to` property');
  _test.ok(_.isObject(from), 'must have `from` property');

  n.normalize_forms(from);

  /* For each form */
  for (var i = 0, len = from.length; i < len; ++i) {
    check_fields(
      _test, (from[i][_scope] || []),
        (to[i][_scope] || []), _fixture.check
    );
  }

  _test.done();
}

/* Tests */
util.make_tests(
  'field-identifiers', exports,
    tests.fixtures.normalize.field_identifiers, _assert, [ 'fields' ]
);
util.make_tests(
  'field-properties', exports,
    tests.fixtures.normalize.field_properties, _assert, [ 'fields' ]
);
util.make_tests(
  'field-select-lists', exports,
    tests.fixtures.normalize.field_select_lists, _assert, [ 'fields' ]
);
util.make_tests(
  'form-identifiers', exports,
    tests.fixtures.normalize.form_identifiers, _assert, [ 'meta' ]
);
util.make_tests(
  'field-properties', exports,
    tests.fixtures.normalize.form_properties, _assert, [ 'meta' ]
);
util.make_tests(
  'field-validations', exports,
    tests.fixtures.normalize.field_validations, _assert, [ 'fields' ]
);
util.make_tests(
  'field-conditions', exports,
    tests.fixtures.normalize.field_conditions, _assert, [ 'fields' ]
);
