
var tv4 = require('tv4'),
    _ = require('underscore'),
    util = require('./include/util'),
    schemas = require('../lib/schemas/all'),
    fixtures = require('./fixtures/compiled'),
    reference_rewriter = require('../lib/reference');


/**
 * @name _assert
 */
var _assert = function(_test, _fixture, _value, _valid) {

  _test.expect(2);

  /* Rewrite references */
  var rv = reference_rewriter.rewrite_all(_fixture.content);

  _test.ok(
    rv.valid, 'Rewriting must succeed'
  );

  /* Validate against schema */
  rv = tv4.validateResult(_fixture.content, schemas.core);

  _test.equal(
    rv.valid, _valid, 
      ' must ' + (!_valid ? 'not ' : '') + 'validate'
  );

  _test.done();
}

util.make_tests(
  'valid', exports,
    fixtures.schema.valid, _assert, [ true ]
);

util.make_tests(
  'invalid', exports,
    fixtures.schema.invalid, _assert, [ false ]
);
