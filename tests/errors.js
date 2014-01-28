
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    deepEqual = require('deep-equal'),
    util = require('./util/util.js'),
    normalizer = require('../lib/normalize.js'),
    input_validator = require('../lib/input.js'),
    tests = require('./fixtures/compiled.js');


/**
 * @name compare_partial_recursive:
 */
var compare_recursive_partial = function (_expect, _data) {

  /* Object case */
  if (_.isObject(_expect)) {
    if (!_.isObject(_data)) {
      return false;
    }
    for (var k in _expect) {
      if (!compare_recursive_partial(_data[k], _expect[k])) {
        return false;
      }
    }
  /* Array case */
  } else if (_.isArray(_expect)) {
    if (!_.isArray(_data)) {
      return false;
    }
    for (var i = 0, len = _expect.length; i < len; ++i) {
      if (!compare_recursive_partial(_data[i], _expect[i])) {
        return false;
      }
    }
  /* Other cases */
  } else if (!_.isUndefined(_expect)) {
    return deepEqual(_data, _expect);
  }

  return true;
};


/**
 * @name _validate:
 */
var _validate = function (_fields, _expect, _input, _label, _i) {

  input_validator.validate_all(
    _input, _fields,
    wru.async(_label, function (_rv) {
      wru.assert(
        _label + ' at offset ' + _i + ' should produce expected output',
          compare_recursive_partial(_expect, _rv)
      );
    })
  );
};


/**
 * @name _assert
 */
var _assert = function (_test, _i, _scope) {

  var label = 'Test #' + (_i + 1);

  var form = _test.form;
  var input = _test.input, expect = _test.expect;

  wru.assert(label + ' must have valid `form` property', _.isObject(form));
  wru.assert(label + ' must have valid `input` property', _.isArray(input));
  wru.assert(label + ' must have valid`expect` property', _.isArray(expect));

  var forms = [ form ];
  var fields = normalizer.normalize_forms(forms)[0].fields;

  wru.assert(label + ' must normalize properly', _.isArray(fields));

  for (var i = 0, len = input.length; i < len; ++i) {
    _validate(fields, expect[i], input[i], label, i);
  }
}


/**
 * @name main
 */
var main = function (_argc, _argv) {

  wru.test([
    util.make_test(
      'input-validation-errors', 
        tests.fixtures.errors.input, _assert
    )
  ]);

  return 0;
};


/* Start */
return main(process.argc, process.argv);

