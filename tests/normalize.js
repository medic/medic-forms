
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
 * @name make_test:
 */
var make_test = function (_name, _scope, _file) {

  var tests = JSON.parse(fs.readFileSync(_file));

  if (!_.isArray(tests)) {
    fatal(_file + ' is malformed; aborting');
  }

  return {
    name: _name,
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
          var lhs = (to[i][_scope] || []);
          var rhs = (from[i][_scope] || []);

          if (!_.isArray(rhs)) {
            rhs = [ rhs ];
          }

          /* For each checkable object in scope */
          for (var j = 0, ln = lhs.length; j < ln; ++j) {

            wru.assert(
              h + 'properties ' + JSON.stringify(check) + ' must match',
                compare_partial(lhs[j], rhs[j], _test.check)
            );
          }
        }
      });
    }
  };
};

/**
 * @name main:
 */
var main = function (_argc, _argv) {

  wru.test([
    make_test(
      'field-name-normalization', 'fields',
        'tests/fixtures/normalize/field-names.json'
    ),
    make_test(
      'field-option-normalization', 'fields',
        'tests/fixtures/normalize/field-options.json'
    ),
    make_test(
      'form-name-normalization', 'meta',
        'tests/fixtures/normalize/form-names.json'
    ),
    make_test(
      'form-option-normalization', 'meta',
        'tests/fixtures/normalize/form-options.json'
    )
  ]);

  return 0;
};

process.exit(
  main(process.argc, process.argv)
);

