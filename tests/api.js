
var fs = require('fs'),
    async = require('async'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    api = require('../lib/api'),
    util = require('./include/util'),
    fixtures = require('./fixtures/compiled');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture) {

  /* Top-level fixtures */
  var fixtures = _fixture.fixtures;
  var expect = _fixture.expect;

  _test.ok(
    _.isObject(fixtures),
      'must have valid `fixtures` property'
  );

  _test.ok(
    _.isObject(expect),
      'must have valid `expect` property'
  );

  /* Form-specific fixtures */
  var forms = fixtures.forms;
  var expect_forms = expect.forms;

  _test.ok(
    _.isObject(forms),
      'must have valid `fixtures.forms` property'
  );

  _test.ok(
    _.isObject(expect_forms),
      'must have valid `expect.forms` property'
  );

  /* Input-specific fixtures */
  var input = fixtures.input;
  var expect_input = expect.input;

  _test.ok(
    _.isObject(input),
      'must have valid `fixtures.input` property'
  );

  _test.ok(
    _.isObject(expect_input),
      'must have valid `expect.input` property'
  );

  /* Test API */
  return async.waterfall([

    /* Test `create` API */
    function (_next_fn) {

      api.create({}, function (_rv) {

        /* Sanity checks */
        _test.ok(_.isObject(this), 'must initialize properly');
        _test.ok(_.isObject(_rv), 'must yield a result object');

        return _next_fn(null, this);
      });
    },

    /* Test `load` API */
    function (_api, _next_fn) {

      _api.load(forms, function (_rv) {

        _test.ok(
          util.is_recursive_subset(expect.forms, _rv),
            'should produce expected result object'
        );

        return _next_fn(null, _api);
      });
    },

    /* Test `fill` API */
    function (_api, _next_fn) {

      return _next_fn();
    }

  ], function (_err) {

    /* Finished */
    _test.done();
  });
  
}

/* Tests */
util.make_tests(
  'load-forms',
    exports, fixtures.api.load, _assert
);
