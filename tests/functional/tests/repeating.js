var assert = require('assert'),
    util = require('../util');

var form = {
  "meta": {
    "id": "TEST"
  },
  "fields": [
    {
      "id": "comments",
      "name": "Comments",
      "type": "string",
      "repeat": true
    }
  ]
};

exports['zero repetitions'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser.pressButton('button');
  }, function(browser) {
    util.assert_result(browser, {});
  }, callback);
};


exports['single repetition'] = function(test, callback) {
  test.run(form, [
    function(browser) {
      return browser
        .clickLink('.repeat-id-comments .add-item');
    },
    function(browser) {
      return browser
        .fill('comments[0]', 'first')
        .pressButton('button');
    }
  ], function(browser) {
    util.assert_result(browser, {
      "comments[0]": "first"
    });
  }, callback);
};

exports['multiple repetitions'] = function(test, callback) {
  test.run(form, [
    function(browser) {
      return browser
        .clickLink('.repeat-id-comments .add-item');
    },
    function(browser) {
      return browser
        .clickLink('.repeat-id-comments .add-item');
    },
    function(browser) {
      return browser
        .clickLink('.repeat-id-comments .add-item');
    },
    function(browser) {
      return browser
        .fill('comments[0]', 'first')
        .fill('comments[1]', 'second')
        .fill('comments[2]', 'third')
        .pressButton('button');
    }
  ], function(browser) {
    util.assert_result(browser, {
      "comments[0]": "first",
      "comments[1]": "second",
      "comments[2]": "third"
    });
  }, callback);
};

// TODO delete removes repition
// TODO bind repetition values on error
// TODO array of defaults
// TODO scripted or integer repeat property