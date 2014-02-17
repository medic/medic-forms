
var fs = require('fs'),
    _ = require('underscore'),
    api = require('../lib/api'),
    util = require('./include/util'),
    jsdump = require('jsDump'),
    fixtures = require('./fixtures/compiled');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture) {

  var forms = _fixture.forms;
  var expect = _fixture.expect;

  /* Sanity check for fixture */
  _test.ok(_.isObject(forms), 'must have valid `forms` property');
  _test.ok(_.isObject(expect), 'must have valid `expect` property');

  api.create({}, function (_result) {

    /* Sanity checks for `create` API */
    _test.ok(_.isObject(this), 'must initialize properly');
    _test.ok(_.isObject(_result), 'must yield a result object');

    /* Test `load` API */
    this.load(forms, function (_rv) {
      _test.ok(
        util.is_recursive_subset(expect, _rv),
          'should produce expected result object'
      );
      _test.done();
    });
  });
}

/* Tests */
util.make_tests(
  'load-forms',
    exports, fixtures.api.load, _assert
);
