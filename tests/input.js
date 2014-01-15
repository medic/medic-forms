var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    testUtil = require('./util/util.js'),
    input = require('../lib/input.js');

/**
 * @name _assert
 */
var _assert = function(_test, _i) {

  var valid = _test.valid;
  var field = _test.field;
  var values = _test.values;

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

    var label = h + ' at offset ' + _j;
    var detail = ' (test was `' + json + '`)';
    var rv = input.validate_any.call(input, _value, field);

    wru.assert(
      label + ' must ' + (valid ? '' : 'not ') + 'validate' + detail,
        (rv.valid === valid)
    );
  });

}

testUtil.make_test(
  'input-value-validation', 
  'tests/fixtures/input/values.json',
  _assert 
);