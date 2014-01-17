
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    tests = require('./util/util.js'),
    input = require('../lib/input.js');

/**
 * @name _assert:
 */
var _assert = function (_test, _i) {

  var valid = _test.valid;
  var field = _test.field;
  var values = _test.values;
  var is_async = _test.async;

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

  input.register_validator('startsWithA', function(_input) {
    if(_input.charAt(0) === 'A') {
      return {valid: true};
    }
    return {
      valid: false,
      error: 'Input does not start with the letter A'
    }
  });

  input.register_validator('endsWithA', function(_input) {
    if(_input.charAt(_input.length - 1) === 'A') {
      return {valid: true};
    }
    return {
      valid: false,
      error: 'Input does not end with the letter A'
    }
  });

  _.each(values, function (_value, _j) {

    var async_ready = false;
    var label = h + ' at offset ' + _j;

    if (is_async) {
      async_ready = label + " ready";
      field.validationReady = async_ready;
    }

    var rv = input.validate_any.call(input, _value, field);

    if (!rv && async_ready) {

      /* Asynchronous assertion */
      input.getEventEmitter().once(
        async_ready,
        wru.async(function (rv) {
          _assert_single(label, valid, rv, json);
        })
      );

    } else {
      /* Synchronous assertion */
      _assert_single(label, valid, rv, json);
    }
  });
};

var _assert_single = function (label, valid, rv, json) {
  wru.assert(
    label + ' must ' + (valid ? '' : 'not ') + 'validate'
     + '\n\terror was `' + rv.error + '`'
     + '\n\ttest was `' + json + '`)',
      (rv.valid === valid)
  );
}

wru.test(
  tests.make_test(
    'input-value-validation',
      'tests/fixtures/input/values.json', _assert
  )
);

