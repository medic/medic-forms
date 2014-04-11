var assert = require('assert');

var form = {
  "meta": {
    "id": "TEST"
  },
  "fields": [
    {
      "id": "name",
      "name": "Patient Name",
      "type": "string",
      "default": "Curious George"
    }
  ]
};

exports['render defaults'] = function(test, callback) {
  test.run(form, null, function(browser) {
    assert.equal(browser.query('#row-name input').value, 'Curious George');
  }, callback);
};

// TODO scripted defaults