
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    v = require('../lib/validate.js');

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
var make_test = function (_name, _file, _function_name) {

  var tests = JSON.parse(fs.readFileSync(_file));

  if (!_.isArray(tests)) {
    fatal(file + ' is malformed; aborting');
  }

  return {
    name: _name,
    test: function () {
      _.each(tests, function (_test, _i) {

        var h = 'Test #' + (_i + 1) + ' ';
        var rv = v[_function_name].call(v, _test.forms);

        wru.assert(
          h + 'must ' + (_test.valid ? '' : 'not ') + 'validate',
            (rv.valid === _test.valid)
        );
      });
    }
  };
};

/**
 * @name main:
 */
var main = function (_argc, _argv) {

  var base_path = 'tests/fixtures/validate';

  wru.test([
    make_test(
      'field-validation',
         base_path + '/fields.json', 'validate_forms'
    ),
    make_test(
      'form-validation',
         base_path + '/forms.json', 'validate_forms'
    ),
    make_test(
      'select-list-validation',
         base_path + '/select-lists.json', 'validate_forms'
    )
  ]);
};


main(process.argc, process.argv);

