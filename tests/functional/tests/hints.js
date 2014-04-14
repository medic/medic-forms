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
    assert.equal(browser.query('.field-id-title input').name, 'title');
    assert.equal(browser.query('.field-id-description textarea').name, 'description');
  }, callback);
};