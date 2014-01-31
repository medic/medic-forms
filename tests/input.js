
var fs = require('fs'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    util = require('./util'),
    input = require('../lib/input'),
    tests = require('./fixtures/compiled');

/**
 * @name _assert:
 */
var _assert = function (_test, _fixture, _value) {

  var valid = _fixture.valid;
  var skipped = _fixture.skipped;
  var field = _fixture.field;
  var inputs = _fixture.inputs;

  _test.expect(2);

  input.register_validator('startsWithA', function (_input) {

    if (_input.charAt(0) === 'A') {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Input does not start with the letter A'
    };
  });

  input.register_validator('endsWithA', function (_input) {

    if (_input.charAt(_input.length - 1) === 'A') {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Input does not end with the letter A'
    };
  });


  input.validate_any(_value, field, inputs, {}, 
    function (_r) {
      _test.equal(_r.valid, valid, 
        _value + ' must ' + (valid ? '' : 'not ') + 'validate');
      _test.equal(!_r.skipped, !skipped, 
        _value + ' must ' + (skipped ? '' : 'not ') + 'be skipped');
      _test.done();
    }
  );

};

util.make_tests(
  'input-value-validation', exports,
    tests.fixtures.input.values, _assert
);