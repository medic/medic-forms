
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    tests = require('./util/util.js'),
    v = require('../lib/validate.js');

/**
 * @name _assert
 */
var _assert = function(_test, _i) {

  var h = 'Test #' + (_i + 1) + ' ';
  var rv = v['validate_forms'].call(v, _test.forms);

  wru.assert(
    h + 'must ' + (_test.valid ? '' : 'not ') + 'validate',
      (rv.valid === _test.valid)
  );
}

wru.test([
  tests.make_test(
    'field-validation', 
    'tests/fixtures/validate/fields.json', 
    _assert
  ),
  tests.make_test(
    'form-validation', 
    'tests/fixtures/validate/forms.json', 
    _assert
  ),
  tests.make_test(
    'select-list-validation', 
    'tests/fixtures/validate/select-lists.json', 
    _assert
  )
]);