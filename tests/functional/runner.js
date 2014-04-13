
var path = require('path'),
  fs = require('fs'),
  async = require('async'),
  testsDir = __dirname + '/tests',
  tests = {},
  zombie = require('zombie'),
  browser = new zombie(),
  pass = String.fromCharCode(10004),
  fail = String.fromCharCode(10006);


/**
 * @name framework
 */
var framework = {

  /**
   * Renders the given form in the DOM.
   */
  run: function (definition, interactions, assertions, callback) {

    if (!callback) {
      throw new Error('callback is required');
    }

    var _runInteractions = function () {
      if (interactions) {
        return interactions.call(this, browser);
      } else {
        return {
          // null promise
          then: function (fn) {
            fn.apply(this, arguments);
          }
        }
      }
    };

    var _runAssertions = function () {
      try {
        assertions.call(this, browser);
        callback();
      } catch(err) {
        callback(err);
      }
    };

    var formDefinition = escape(JSON.stringify(definition));

    browser
      .visit('http://127.0.0.1:7357/?formDefinition=' + formDefinition)
      .then(function () {
        _runInteractions().then(_runAssertions);
      })
      .fail(callback);
  }
};


/**
 * @name run
 */
exports.run = function (cb) {

  fs.readdir(testsDir, function (err, files) {
    files.forEach(function (file) {
      if (!file.match(/\.js$/)) {
        return;
      }
      var suite = require(path.join(testsDir, file));
      for (var testname in suite) {
        tests[file + ': ' + testname] = suite[testname];
      }
    });

    async.eachSeries(
      Object.keys(tests),
      function (key, callback) {
        tests[key].call(this, framework, function (err) {
          if (err) {
            console.error(fail + ' ' + key);
          } else {
            console.log(pass + ' ' + key);
          }
          callback(err);
        });
      }, 
      cb
    );
  });
  
};
