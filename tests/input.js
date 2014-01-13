
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
        var async = _test.async;

        var h = 'Test #' + (_i + 1);
        var json = JSON.stringify(_test);

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
            _.isObject(field)
        );

         _.each(values, function (_value, _j) {

          var label = h + (_j > 0 ? 'at offset ' + _j + ' ' : '');
          var testReady;
          if (async) {
            testReady = 'Test #' + (_i + 1) +
              (_j > 0 ? ' at offset ' + _j + ' ' : '') +
              " ready";
            field.validationReady = testReady;
          }

          var rv = input.validate_any.call(input, _value, field);

          if (rv === null && testReady) {
            /* Asynchronous assertion */
            input.getEventEmitter().once(testReady,
              wru.async(function (rv) {
                wru.assert(
                  label + 'must ' + (valid ? '' : 'not ') + 'validate', (rv.valid === valid)
                );
              }));
          } else {
            /* Synchronous assertion */
            wru.assert(
              label + 'must ' + (valid ? '' : 'not ') + 'validate', (rv.valid === valid)
            );
          }
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

