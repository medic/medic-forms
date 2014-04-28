var assert = require('assert'),
    util = require('../util');


exports['skip conditions are evaluated'] = function (test, callback) {

  var form = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "title",
        "name": "Title",
        "type": "string"
      },
      {
        "id": "noskip",
        "name": "Description1",
        "type": "string",
        "conditions": {
          "structured": {
            "title": ""
          }
        }
      },
      {
        "id": "skip",
        "name": "Description2",
        "type": "string",
        "conditions": {
          "structured": {
            "title": "2"
          }
        }
      }
    ]
  };

  test.run(form, null, function (browser) {

    assert.ok(util.has_class(browser, 'skip', 'skipped'));
    assert.ok(!util.has_class(browser, 'noskip', 'skipped'));

  }, callback);
};


exports['javascript conditions are evaluated'] = function (test, callback) {

  var form = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "title",
        "name": "Title",
        "type": "string"
      },
      {
        "id": "noskip",
        "name": "Short",
        "type": "string",
        "required": true,
        "conditions": {
          "javascript": "return inputs.title && inputs.title.length < 10"
        }
      },
      {
        "id": "skip",
        "name": "Long",
        "type": "string",
        "required": true,
        "conditions": {
          "javascript": "return inputs.title && inputs.title.length >= 10"
        }
      }
    ]
  };

  test.run(form, function (browser) {

    return browser
      .fill('title', 'short')
      .pressButton('button');

  }, function (browser) {

    assert.ok(util.has_class(browser, 'skip', 'skipped'));
    assert.ok(!util.has_class(browser, 'skip', 'error'));
    assert.ok(!util.has_class(browser, 'noskip', 'skipped'));
    assert.ok(util.has_class(browser, 'noskip', 'error'));

  }, callback);
};


exports['invalid skip conditions'] = function (test, callback) {

  var form = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "title",
        "name": "Title",
        "type": "string"
      },
      {
        "id": "noskip",
        "name": "Description1",
        "type": "string",
        "conditions": {
          "structured": {
            "fieldthatdoesnotexist": ""
          }
        }
      }
    ]
  };

  test.run(form, null, function (browser) {

    util.assert_error(
      browser, 
      'formDefinition', 
      'Condition refers to itself or non-existent field'
    );

  }, callback);
};

// TODO skipped fields should not be submitted

