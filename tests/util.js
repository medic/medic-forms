
var fs = require('fs'),
    _ = require('underscore');


/**
 * @name make_tests
 *   Creates a list of tests for `nodeunit`, given an `_exports`
 *   object in which to create the tests, a `_name`a `_fixtures` object
 *   containing test fixtures, a `_test_fn` containing the test
 *   code to be executed, and a list of one or more parameters
 *   in `_test_args` to be provided as arguments to `_test_fn`.
 */
exports.make_tests = function (_name, _exports,
                               _fixtures, _test_fn, _test_args) {

  _.each(_fixtures, function (_fixture, _i) {
    _exports[_name + ': Test fixture #' + (_i + 1)] = function (_test) {
      _test_fn.apply(
        this, [ _test, _fixture, _i ].concat(_test_args)
      );
    };
  });
};

