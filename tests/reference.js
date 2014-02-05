
var fs = require('fs'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    util = require('./include/util'),
    deepEqual = require('deep-equal'),
    fixtures = require('./fixtures/compiled'),
    reference_rewriter = require('../lib/reference');


/**
 * @name _assert
 */
var _assert = function(_test, _fixture) {

  _test.expect(4);

  _test.ok(
    _.isObject(_fixture.to),
      'Fixture must have `to` property'
  );

  _test.ok(
    _.isObject(_fixture.from),
      'Fixture must have `from` property'
  );

  var rv = reference_rewriter.rewrite(_fixture.from);

  _test.ok(
    rv.valid, 'Reference rewriting must succeed'
  );

  _test.ok(
    deepEqual(_fixture.from, _fixture.to),
      'Rewritten result must match expected'
  );

  _test.done();
}

/* Tests */
util.make_tests(
  'rewriting', exports,
    fixtures.reference.rewrite, _assert
);
