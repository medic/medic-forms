var assert = require('assert');

var form = {
  "meta": {
    "id": "TEST"
  },
  "fields": [
    {
      "id": "title",
      "name": "Title",
      "type": "string",
      "conditions": {}
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

exports['skip conditions are evaluated'] = function(test, callback) {
  test.run(form, null, function(browser) {
    assert.equal(browser.query('#row-skip').className, 'skipped');
    assert.equal(browser.query('#row-noskip').className, '');
  }, callback);
};