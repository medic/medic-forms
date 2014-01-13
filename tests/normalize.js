var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    deepEqual = require('deep-equal'),
    tests = require('./util/util.js'),
    n = require('../lib/normalize.js');

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
var check_fields = function (_name, _fields,
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
        _name, (_fields[i].fields || []), (_expected[i].fields || []),
          _properties, context.concat([ i ])
      );

    } else {

      var path_text = (
        context.length > 0 ?
          ', along subfield path ' + JSON.stringify(context) : ''
      );

      wru.assert(
        _name + path_text + ': properties ' +
          JSON.stringify(_properties) + ' must match',
        compare_partial(_expected[i], _fields[i], _properties)
      );
    }
  }
};

/**
 * @name _assert
 */
var _assert = function(_test, _i, _scope) {
  var name = 'Test #' + (_i + 1);
  var from = _test.from, to = _test.to;

  wru.assert(name + ' must have `to` property', _.isObject(to));
  wru.assert(name + ' must have `from` property', _.isObject(from));

  n.normalize_forms(from);

  /* For each form */
  for (var i = 0, len = from.length; i < len; ++i) {
    check_fields(
      name, (from[i][_scope] || []),
        (to[i][_scope] || []), _test.check
    );
  }
}

/**
 * @name main
 */
var main = function (_argc, _argv) {

  wru.test([
    tests.make_test(
      'field-name-normalization', 
        'tests/fixtures/normalize/field-identifiers.json',
        _assert, [ 'fields' ]
    ),
    tests.make_test(
      'field-option-normalization',
        'tests/fixtures/normalize/field-properties.json',
        _assert, [ 'fields' ]
    ),
    tests.make_test(
      'field-select-normalization', 
        'tests/fixtures/normalize/field-select-lists.json',
        _assert, [ 'fields' ]
    ),
    tests.make_test(
      'form-name-normalization',
        'tests/fixtures/normalize/form-identifiers.json',
        _assert, [ 'meta' ]
    ),
    tests.make_test(
      'form-option-normalization',
        'tests/fixtures/normalize/form-properties.json',
        _assert, [ 'meta' ]
    )
  ]);

  return 0;
};

process.exit(
  main(process.argc, process.argv)
);

