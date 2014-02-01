
var fs = require('fs'),
    _ = require('underscore'),
    util = require('./include/util'),
    deepEqual = require('deep-equal'),
    fixtures= require('./fixtures/compiled'),
    reference_rewriter = require('../lib/reference');


/**
 * @name _assert
 */
var _assert = function(_test, _fixture) {

  _test.expect(3);

  _test.ok(_.isObject(_fixture.to), 'must have `to` property');
  _test.ok(_.isObject(_fixture.from), 'must have `from` property');

  var rewrite = reference_rewriter.rewrite(_fixture.from);

  _test.ok(
    deepEqual(rewrite, _fixture.to),
    'rewritten result must match expected'
  );

  _test.done();
}

/* Tests */
util.make_tests(
  'rewriting', exports,
    fixtures.reference.rewrite, _assert
);
