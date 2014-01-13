
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

  _.each(values, function (_value, _j) {

    var async_ready = false;
    var label = h + ' at offset ' + _j;
    var detail = ' (test was `' + json + '`)';

    var rv = input.validate_any.call(input, _value, field);

    if (!rv) {

      /* FIXME */
      return;

      /* Asynchronous assertion */
      input.getEventEmitter().once(
        async_ready,
        wru.async(function (rv) {
          wru.assert(
            label + ' must ' + (valid ? '' : 'not ') + 'validate' + detail,
              (rv.valid === valid)
          );
        })
      );

    } else {

      /* Synchronous assertion */
      wru.assert(
        label + ' must ' + (valid ? '' : 'not ') + 'validate' + detail,
          (rv.valid === valid)
      );
    }
  });
}

tests.make_test(
  'input-value-validation', 
    'tests/fixtures/input/values.json', _assert 
);

