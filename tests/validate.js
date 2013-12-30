
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    v = require('../lib/validate.js');

/**
 * @name fatal:
 */
var fatal = function (_message) {

  puts("Fatal error: " + _message);
  process.exit(1);
};

/**
 * @name main:
 */
var main = function (_argc, _argv) {

  var file = 'tests/json/validate/validate.json';
  var tests = JSON.parse(fs.readFileSync(file));

  if (!_.isArray(tests)) {
    fatal(file + ' is malformed; aborting');
  }
  
  wru.test([{
    name: 'validation',
    test: function () {
      _.each(tests, function (_test, _i) {

        var h = 'Test #' + (_i + 1) + ' ';
        var rv = v.validate_field_identifiers(_test.forms);

        wru.assert(
          h + 'validates appropriately',
            (rv.valid === _test.valid)
        );
      });
    }
  }]);
};

main(process.argc, process.argv);

