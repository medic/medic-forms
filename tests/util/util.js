
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore');


/**
 * @name _fatal
 *   Exit with a fatal error message.
 */
var _fatal = function (_message) {

  console.log("Fatal error: " + _message);
  process.exit(1);
};


/**
 * @name make_test
 *   Creates a list of tests for `wru`, given a test name,
 *   a path to a JSON-encoded fixture file, a function `_assertion_fn`
 *   containing the test code to be executed, and a list of one or more
 *   parameters to be provided to `_assertion_fn`.
 *
 */
exports.make_test = function(_name, _file, _assertion_fn, _assertion_args) {

  var tests = JSON.parse(fs.readFileSync(_file));

  if (!_.isArray(tests)) {
    _fatal(_file + ' is malformed; aborting');
  }

  return {
    name: _name,
    test: function() {
      _.each(tests, function (_test, _i) {
        _assertion_fn.apply(this, [ _test, _i ].concat(_assertion_args));
      });
    }
  };
  
};
