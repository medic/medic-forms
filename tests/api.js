
var fs = require('fs'),
    wru = require('wru'),
    _ = require('underscore');

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

};

main(process.argc, process.argv);

