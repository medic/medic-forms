
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
      "length": 50
    },
    {
      "id": "title",
      "name": "Title",
      "type": "string",
      "length": [10]
    },
    {
      "id": "email",
      "name": "Email",
      "type": "email",
      "length": [20, 150]
    },
    {
      "id": "comments",
      "name": "Comments",
      "type": "string"
    }
  ]
};


exports['test length attribute'] = function (test, callback) {

  test.run(form, null, function (browser) {

    util.assert_attribute(browser, 'name', 'maxlength', '50');
    util.assert_attribute(browser, 'email', 'maxlength', '150');

    assert.ok(
      !browser.query('.field-id-title input').hasAttribute('maxlength')
    );
    assert.ok(
      !browser.query('.field-id-comments input').hasAttribute('maxlength')
    );

  }, callback);
};

