var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore');

/**
 * @name _fatal
 *   Exit with a fatal error message
 */
var _fatal = function (_message) {
  console.log("Fatal error: " + _message);
  process.exit(1);
};

/**
 * @name make_test
 *   Creates and execute the tests
 */
exports.make_test = function(_name, _file, _assertion) {

  var tests = JSON.parse(fs.readFileSync(_file));

  if (!_.isArray(tests)) {
    _fatal(_file + ' is malformed; aborting');
  }

  wru.test([
    {
      name: _name,
      test: function() {
        _.each(tests, function (_test, _i) {
          _assertion(_test, _i);
        });
      }
    }
  ]);
  
};