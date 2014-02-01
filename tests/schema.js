
var tv4 = require('tv4'),
    _ = require('underscore'),
    util = require('./include/util'),
    schemas = require('../lib/schemas/all.js'),
    fixtures = require('./fixtures/compiled.js'),
    reference_rewriter = require('../lib/reference');


/**
 * @name _assert
 */
var _assert = function(_test, _fixture, _value, _valid) {

  var rv = tv4.validateResult(
    reference_rewriter.rewrite_each(_fixture),
      schemas.core
  );

  _test.expect(1);

  _test.equal(
    rv.valid, _valid, 
      ' must ' + (!_valid ? 'not ' : '') + 'validate'
  );

  _test.done();
}

util.make_tests(
  'valid', exports,
    fixtures.forms.valid, _assert, [ true ]
);

util.make_tests(
  'invalid', exports,
    fixtures.forms.invalid, _assert, [ false ]
);
