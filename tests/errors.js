
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    deepEqual = require('deep-equal'),
    util = require('./util/util.js'),
    n = require('../lib/normalize.js'),
    i = require('../lib/input.js'),
    tests = require('./fixtures.js');

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
  } else {
    return deepEqual(_data, _expect);
  }

  return true;
};

/**
 * @name _assert
 */
var _assert = function (_test, _i, _scope) {

  var label = 'Test #' + (_i + 1);

  var form = _test.form;
  var input = _test.input, expect = _test.expect;

  wru.assert(label + ' must have `form` property', _.isObject(form));
  wru.assert(label + ' must have `input` property', _.isObject(input));
  wru.assert(label + ' must have `expect` property', _.isObject(expect));

  var forms = [ form ];
  var fields = n.normalize_forms(forms)[0].fields;

  wru.assert(label + ' must normalize properly', _.isArray(fields));

  i.validate_all(
    input, fields,
    wru.async(label, function (_rv) {
      wru.assert(
        label + ' should produce expected error output',
          compare_recursive_partial(expect, _rv)
      );
    })
  );
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

