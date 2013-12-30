
var fs = require('fs'),
    tv4 = require('tv4'),
    wru = require('wru'),
    _ = require('underscore'),
    r = require('../lib/reference.js');

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

  var schema_file = 'schemas/medic-forms.json';
  var valid_file = 'tests/json/forms/valid.json';
  var invalid_file = 'tests/json/forms/invalid.json';

  var schema = JSON.parse(fs.readFileSync(schema_file));
  var valid_tests = JSON.parse(fs.readFileSync(valid_file));
  var invalid_tests = JSON.parse(fs.readFileSync(invalid_file));

  if (!_.isArray(valid_tests)) {
    fatal(valid_file + ' is malformed; aborting');
  }
  
  if (!_.isArray(invalid_tests)) {
    fatal(invalid_file + ' is malformed; aborting');
  }

  wru.test([{
    name: 'valid-forms',
    test: function () {
      _.each(valid_tests, function (_valid_forms, _i) {
        var rv = tv4.validateResult(r.rewrite_each(_valid_forms), schema);
        wru.assert('Item #' + (_i + 1) + ' should be valid', rv.valid);
      });
    }
  }, {
    name: 'invalid-forms',
    test: function () {
      _.each(invalid_tests, function (_invalid_forms, _i) {
        var rv = tv4.validateResult(r.rewrite_each(_invalid_forms), schema);
        wru.assert('Item #' + (_i + 1) + ' should be invalid', !rv.valid);
      });
    }
  }]);
};

main(process.argc, process.argv);

