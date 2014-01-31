
var fs = require('fs'),
    tv4 = require('tv4'),
    // wru = require('wru'),
    _ = require('underscore'),
    util = require('./util'),
    r = require('../lib/reference'),
    tests = require('./fixtures/compiled');


/**
 * @name _assert
 */
var _assert = function(_test, _fixture, _value, _valid) {

  var rv = tv4.validateResult(r.rewrite_each(_fixture), tests.schema);
  _test.expect(1);
  _test.equal(rv.valid, _valid, 
    ' must ' + (!_valid ? 'not ' : '') + 'validate');
  _test.done();
}

util.make_tests(
  'valid-forms', exports,
    tests.fixtures.forms.valid, _assert, [ true ]
);

util.make_tests(
  'invalid-forms', exports,
    tests.fixtures.forms.invalid, _assert, [ false ]
);
