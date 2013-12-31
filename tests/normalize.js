
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore'),
    deepEqual = require('deep-equal'),
    n = require('../lib/normalize.js');

/**
 * @name fatal:
 */
var fatal = function (_message) {

  puts("Fatal error: " + _message);
  process.exit(1);
};

/**
 * @name compare_partial:
 */
var compare_partial = function (_lhs, _rhs, _properties) {

  var properties = (_properties || []);

  if (properties.length == 0) {
    return deepEqual(_lhs, _rhs);
  } else {
    for (var i = 0, len = _properties.length; i < len; ++i) {
      var k = _properties[i];
      if (!deepEqual(_lhs[k], _rhs[k])) {
        return false;
      }
    }
  }

  return true;
};

/**
 * @name main:
 */
var main = function (_argc, _argv) {

  var fixture_file = 'tests/fixtures/normalize/forms.json';
  var tests = JSON.parse(fs.readFileSync(fixture_file));

  if (!_.isArray(tests)) {
    fatal(fixture_file + ' is malformed; aborting');
  }

  wru.test({
    name: 'normalization',

    test: function () {
      _.each(tests, function (_test, _i) {

        var h = 'Test #' + (_i + 1) + ' ';
        var from = _test.from, to = _test.to;

        wru.assert(h + 'must have `to` property', _.isObject(to));
        wru.assert(h + 'must have `from` property', _.isObject(from));

        n.normalize_forms(from);

        /* For each form */
        for (var i = 0, len = from.length; i < len; ++i) {

          var check = _test.check;
          var lhs = (to[i].fields || []);
          var rhs = (from[i].fields || []);

          /* For each field */
          for (var j = 0, ln = lhs.length; j < ln; ++j) {

            wru.assert(
              h + 'properties ' + JSON.stringify(check) + ' must match',
                compare_partial(lhs[j], rhs[j], _test.check)
            );
          }
        }
      });
    }
  });

  return 0;
};

process.exit(
  main(process.argc, process.argv)
);

