
var fs = require('fs'),
    _ = require('underscore'),
    util = require('./include/util'),
    deepEqual = require('deep-equal'),
    normalizer = require('../lib/normalize'),
    input_validator = require('../lib/input'),
    fixtures = require('./fixtures/compiled');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture, _value) {

  var form = _fixture.form;
  var input = _value.input;
  var expect = _value.expect;

  _test.expect(5);

  /* Sanity check */
  _test.ok(_.isObject(form), 'must have valid `form` property');
  _test.ok(_.isObject(input), 'must have valid `input` property');
  _test.ok(_.isObject(expect), 'must have valid `expect` property');

  var forms = [ form ];
  var fields = normalizer.normalize_all(forms)[0].fields;

  _test.ok(_.isArray(fields), 'must normalize properly');

  input_validator.validate_all(
    _value.input, fields, function (_rv) {
      _test.ok(
        util.is_recursive_subset(_value.expect, _rv),
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
