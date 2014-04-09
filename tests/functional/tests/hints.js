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
      "required": true
    },
    {
      "id": "description",
      "name": "Description",
      "type": "string",
      "render": "textarea",
      "required": true
    }
  ]
};

exports['render hints take priority'] = function(test, callback) {
  test.run(form, null, function(browser) {
    assert.equal(browser.query('#row-title input').name, 'title');
    assert.equal(browser.query('#row-description textarea').name, 'description');
  }, callback);
};