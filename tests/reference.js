
var fs = require('fs'),
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
 * @name compare:
 */
var compare = function (_lhs, _rhs) {

  return (JSON.stringify(_lhs) === JSON.stringify(_rhs));
};

/**
 * @name main:
 */
var main = function (_argc, _argv) {

  console.log('Running tests...');

  var schema = JSON.parse(
    fs.readFileSync('schemas/medic-forms.json')
  );

  var tests = JSON.parse(
    fs.readFileSync('tests/json/reference/rewrite.json')
  );

  if (!_.isArray(tests)) {
    fatal('tests/json/reference/rewrite.json is malformed; aborting');
  }
  
  wru.test({
    name: 'reference-rewriting',

    test: function () {
      _.each(tests, function (_test, _i) {

        var h = 'Item #' + (_i + 1) + ' ';

        wru.assert(h + 'should have `to` property', _.isObject(_test.to));
        wru.assert(h + 'should have `from` property', _.isObject(_test.from));

        var rewrite = r.rewrite(_test.from);

        wru.assert(
          h + ': rewritten `from` property should equal `to`',
            compare(rewrite, _test.to)
        );
      });
    }
  });

  return 0;
};

process.exit(
  main(process.argc, process.argv)
);

