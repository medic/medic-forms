var assert = require('assert'),
    util = require('../util');

var form = {
  "meta": {
    "id": "TEST"
  },
  "fields": [
    {
      "id": "name",
      "name": "Patient Name",
      "type": "string",
      "required": {
        "javascript": "return 8 % 2 === 0"
      }
    },
    {
      "id": "parent",
      "name": "Parent Name",
      "type": "string",
      "required": {
        "javascript": "return 7 % 2 === 0"
      }
    }
  ]
};

exports['render required fields'] = function(test, callback) {
  test.run(form, null, function(browser) {
    assert.ok(util.has_class(browser, 'name', 'required'));
    assert.ok(!util.has_class(browser, 'parent', 'required'));
  }, callback);
};
