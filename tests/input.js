
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    util = require('./util/util.js'),
    input = require('../lib/input.js'),
    tests = require('./fixtures.js');

/**
 * @name _assert:
 */
var _assert = function (_test, _i) {

  var valid = _test.valid;
  var skipped = _test.skipped;
  var field = _test.field;
  var values = _test.values;
  var is_async = _test.async;
  var inputs = _test.inputs;

  var h = 'Test #' + (_i + 1);
  var json = JSON.stringify(_test);

  wru.assert(
    h + ' must provide an array for the `values` property',
      _.isArray(values)
  );

  wru.assert(
    h + ' must specify a boolean value for the `valid` property',
      _.isBoolean(valid)
  );

  wru.assert(
    h + ' must specify an object for the `field` property',
      _.isObject(field)
  );

  input.register_validator('startsWithA', function (_input) {

    if (_input.charAt(0) === 'A') {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Input does not start with the letter A'
    };
  });

  input.register_validator('endsWithA', function (_input) {

    if (_input.charAt(_input.length - 1) === 'A') {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Input does not end with the letter A'
    };
  });

  return _.each(values, function (_value, _j) {

    var label = h + ' at offset ' + _j;

    input.validate_any(_value, field, inputs, {}, function (_r) {
      _assert_single(label, valid, skipped, _r, json);
    });
  });
};


/**
 * @name _assert_single:
 */
var _assert_single = function (_label, _valid, _skipped, _rv, _json) {

  wru.assert(
    _label + ' must ' + (_valid ? '' : 'not ') + 'validate'
      + '\n\tResult was: `' + JSON.stringify(_rv) + '`'
      + '\n\tTest was: `' + _json + '`)',
      (_rv.valid === _valid)
  );

  wru.assert(
    _label + ' must ' + (_skipped ? '' : 'not ') + 'be skipped'
      + '\n\tResult was: `' + JSON.stringify(_rv) + '`'
      + '\n\tTest was: `' + _json + '`)',
      ((_rv.skipped === _skipped) || (!_skipped && !_rv.skipped))
  );

  console.log('asserted', _label);
};


wru.test(
  util.make_test(
    'input-value-validation',
      tests.fixtures.input.values, _assert
  )
);

