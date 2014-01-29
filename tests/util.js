
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
    if (_fixture.values) {
      _.each(_fixture.values, function (_value, _j) {
        _export(
          _name + ': Test fixture #' + (_i + 1) + ' at offset ' + _j,
            _fixture, _exports, _test_fn, _test_args, _value
        );
      });
    } else {
      _export(_name + ': Test fixture #' + (_i + 1), 
        _fixture, _exports, _test_fn, _test_args);
    }
  });
};

var _export = function (_name, _fixture, _exports,
                        _test_fn, _test_args, _value) {

  _exports[_name] = function (_test) {
    _test_fn.apply(
      this, [ _test, _fixture, _value ].concat(_test_args)
    );
  };
};

