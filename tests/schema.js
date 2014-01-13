
var fs = require('fs'),
    tv4 = require('tv4'),
    wru = require('wru'),
    _ = require('underscore'),
    tests = require('./util/util.js'),
    r = require('../lib/reference.js');

var schema_file = 'schemas/base.json';
var schema = JSON.parse(fs.readFileSync(schema_file));

/**
 * @name _assert
 */
var _assert = function(_test, _i, _valid) {

  var rv = tv4.validateResult(r.rewrite_each(_test), schema);
  wru.assert('Form #' + (_i + 1) + ' must ' + 
    (!_valid ? 'not ' : '') + 'validate', rv.valid === _valid);

}

wru.test([
  tests.make_test(
    'valid-forms', 
    'tests/fixtures/forms/valid.json', 
    _assert,
    true
  ),
  tests.make_test(
    'invalid-forms', 
    'tests/fixtures/forms/invalid.json', 
    _assert,
    false
  )
]);