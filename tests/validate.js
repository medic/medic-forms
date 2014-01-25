
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    util = require('./util/util.js'),
    v = require('../lib/validate.js'),
    tests = require('./fixtures.js');

/**
 * @name _assert
 */
var _assert = function(_test, _i) {

  var label = (
    'Test #' + (_i + 1) +
      ' must ' + (_test.valid ? '' : 'not ') + 'validate'
  );

  v.validate_forms.call(
    v, _test.forms,
    wru.async(
      label, function (_rv) {
        wru.assert(label, (_rv.valid === _test.valid))
      }
    )
  );

}

wru.test([
  util.make_test(
    'field-validation', 
    tests.fixtures.validate.fields,
    _assert
  ),
  util.make_test(
    'form-validation', 
    tests.fixtures.validate.forms,
    _assert
  ),
  util.make_test(
    'select-list-validation', 
    tests.fixtures.validate.select_lists,
    _assert
  )
]);

