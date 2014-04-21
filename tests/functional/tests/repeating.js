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
      "comments": ["first"]
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
      "comments": ["first", "second", "third"]
    });
  }, callback);
};

exports['defaults bound'] = function(test, callback) {

  var form = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "comments",
        "name": "Comments",
        "type": "string",
        "repeat": true,
        "default": ["un", "deux", "trois"]
      }
    ]
  };

  test.run(form, undefined, function(browser) {
    util.assert_attribute(browser, 'comments\\[0\\]', 'value', 'un');
    util.assert_attribute(browser, 'comments\\[1\\]', 'value', 'deux');
    util.assert_attribute(browser, 'comments\\[2\\]', 'value', 'trois');
  }, callback);
};

exports['repeating values bound on error'] = function(test, callback) {
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
      },
      {
        "id": "missing",
        "name": "Missing",
        "type": "string",
        "required": true
      }
    ]
  };

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
    util.assert_attribute(browser, 'comments\\[0\\]', 'value', 'first');
    util.assert_attribute(browser, 'comments\\[1\\]', 'value', 'second');
    util.assert_attribute(browser, 'comments\\[2\\]', 'value', 'third');
  }, callback);
};

// TODO delete removes repetition
// TODO scripted or integer repeat property
// TODO validation on individual fields