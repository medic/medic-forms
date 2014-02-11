
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
    var _test_name = _generate_test_name(_name, _fixture, _i);
    if (_fixture.values) {
      _.each(_fixture.values, function (_value, _j) {
        _export(_test_name + _generate_test_name_suffix(_fixture, _j), 
          _fixture, _exports, _test_fn, _test_args, _value);
      });
    } else {
      _export(_test_name, _fixture, _exports, _test_fn, _test_args);
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

var _generate_test_name = function(_name, _fixture, _index) {
  return _name + ': ' + 
    (_fixture._name ? _fixture._name : 'Test fixture #' + (_index + 1));
};

var _generate_test_name_suffix = function(_fixture, _offset) {
  if (_fixture.values && _fixture.values.length > 1) {
    return ' at offset ' + _offset;
  }
  return '';
}