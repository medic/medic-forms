var path = require('path'),
  fs = require('fs'),
  async = require('async'),
  testsDir = __dirname + '/tests',
  tests = {},
  zombie = require('zombie'),
  browser = new zombie(),
  pass = String.fromCharCode(10004),
  fail = String.fromCharCode(10006);

var framework = {

  /**
   * Renders the given form in the DOM.
   */
  run: function(definition, interactions, assertions, callback) {
    if (!callback) {
      throw new Error('callback is required');
    }
    browser
      .visit('http://127.0.0.1:7357/?formDefinition=' + JSON.stringify(definition))
      // .then(function() {
      //   browser
      //     .fill('formDefinition', JSON.stringify(definition))
      //     .pressButton('submit')
      .then(function() {
        interactions.call(this, browser)
        .then(function() {
          try {
            assertions.call(this, browser);
            callback();
          } catch(err) {
            callback(err);
          }
        })
        .fail(callback);
      })
      //     .fail(callback);
      // })
      .fail(function(err) {
        if (err.code === 'ECONNREFUSED') {
          console.log('HINT: Is the server running?');
        }
        callback(err);
      });
  }

}

exports.run = function(cb) {
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
      function(key, callback) {
        tests[key].call(this, framework, function(err) {
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
