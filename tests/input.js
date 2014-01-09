
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    deepEqual = require('deep-equal'),
    input = require('../lib/input.js');

/**
 * @name fatal:
 */
var fatal = function (_message) {

  puts("Fatal error: " + _message);
  process.exit(1);
};

/**
 * @name make_test
 */
var make_test = function (_name, _file) {

  var tests = JSON.parse(fs.readFileSync(_file));

  if (!_.isArray(tests)) {
    fatal(file + ' is malformed; aborting');
  }
  
  return {
    name: _name,
    test: function () {
      _.each(tests, function (_test, _i) {

        var valid = _test.valid;
        var field = _test.field;
        var values = _test.values;

        var h = 'Test #' + (_i + 1) + ' ';

        wru.assert(
          h + ' must provide an array for the `values` property',
            _.isArray(values)
        );

        wru.assert(
          h + ' must specify a boolean value for the `valid` property',
            _.isBoolean(valid)
        );

        wru.assert(
          h + ' must specify an object for the `field` property',
            _.isBoolean(valid)
        );

        _.each(values, function (_value, _j) {

          var label = h + (_j > 0 ? 'at offset ' + _j + ' ': '');
          var rv = input.validate_any.call(input, _value, field);

          wru.assert(
            label + 'must ' + (valid ? '' : 'not ') + 'validate',
              (rv.valid === valid)
          );
        });
      });
    }
  };
};

/**
 * @name main:
 */
var main = function (_argc, _argv) {

  var base_path = 'tests/fixtures/input';

  wru.test([
    make_test('input-value-validation', base_path + '/values.json')
  ]);
};


main(process.argc, process.argv);

