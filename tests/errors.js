
var fs = require('fs'),
    _ = require('underscore'),
    util = require('./include/util'),
    deepEqual = require('deep-equal'),
    normalizer = require('../lib/normalize'),
    input_validator = require('../lib/input'),
    fixtures = require('./fixtures/compiled');


/**
 * @name compare_partial_recursive:
 */
var compare_recursive_partial = function (_expect, _data) {

  /* Object case */
  if (_.isObject(_expect)) {
    if (!_.isObject(_data)) {
      return false;
    }
    for (var k in _expect) {
      if (!compare_recursive_partial(_data[k], _expect[k])) {
        return false;
      }
    }
  /* Array case */
  } else if (_.isArray(_expect)) {
    if (!_.isArray(_data)) {
      return false;
    }
    for (var i = 0, len = _expect.length; i < len; ++i) {
      if (!compare_recursive_partial(_data[i], _expect[i])) {
        return false;
      }
    }
  /* Other cases */
  } else if (!_.isUndefined(_expect)) {
    return deepEqual(_data, _expect);
  }

  return true;
};


/**
 * @name _assert
 */
var _assert = function (_test, _fixture, _value) {

  var form = _fixture.form;
  var input = _value.input;
  var expect = _value.expect;

  _test.expect(5);

  /* sanity check */
  _test.ok(_.isObject(form), 'must have valid `form` property');
  _test.ok(_.isObject(input), 'must have valid `input` property');
  _test.ok(_.isObject(expect), 'must have valid `expect` property');

  var forms = [ form ];
  var fields = normalizer.normalize_forms(forms)[0].fields;

  _test.ok(_.isArray(fields), 'must normalize properly');

  input_validator.validate_all(
    _value.input, 
    fields,
    function (_rv) {
      _test.ok(
        compare_recursive_partial(_value.expect, _rv),
        'should produce expected output'
      );
      _test.done();
    }
  );
}

/* Tests */
util.make_tests(
  'input-validation-errors', exports,
    fixtures.errors.input, _assert
);
