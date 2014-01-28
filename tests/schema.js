
var fs = require('fs'),
    tv4 = require('tv4'),
    wru = require('wru'),
    _ = require('underscore'),
    util = require('./util/util.js'),
    r = require('../lib/reference.js'),
    tests = require('./fixtures/compiled.js');


/**
 * @name _assert
 */
var _assert = function(_test, _i, _valid) {

  var rv = tv4.validateResult(r.rewrite_each(_test), tests.schema);
  wru.assert('Form #' + (_i + 1) + ' must ' + 
    (!_valid ? 'not ' : '') + 'validate', rv.valid === _valid);
}


/* Start */
return wru.test([
  util.make_test(
    'valid-forms', 
    tests.fixtures.forms.valid,
    _assert,
    [ true ]
  ),
  util.make_test(
    'invalid-forms', 
    tests.fixtures.forms.invalid,
    _assert,
    [ false ]
  )
]);

