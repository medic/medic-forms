var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    deepEqual = require('deep-equal'),
    tests = require('./util/util.js'),
    r = require('../lib/reference.js');

/**
 * @name _assert
 */
var _assert = function(_test, _i) {

  var h = 'Test #' + (_i + 1) + ' ';

  wru.assert(h + 'must have `to` property', _.isObject(_test.to));
  wru.assert(h + 'must have `from` property', _.isObject(_test.from));

  var rewrite = r.rewrite(_test.from);

  wru.assert(
    h + 'rewritten result must match expected',
      deepEqual(rewrite, _test.to)
  );
}

wru.test(
  tests.make_test(
    'rewriting', 
    'tests/fixtures/reference/rewrite.json', 
    _assert
  )
);