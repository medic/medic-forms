var assert = require('assert');

exports['skip conditions are evaluated'] = function(test, callback) {
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
  test.run(form, null, function(browser) {
    assert.equal(browser.query('#row-skip').className, 'skipped');
    assert.equal(browser.query('#row-noskip').className, '');
  }, callback);
};

exports['javascript skip conditions are evaluated'] = function(test, callback) {
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
  test.run(form, function(browser) {
    return browser
      .fill('title', 'short')
      .pressButton('button');
  }, function(browser) {
    assert.equal(browser.query('#row-noskip').className, 'error required');
    assert.equal(browser.query('#row-skip').className, 'required skipped');
  }, callback);
};
