var assert = require('assert'),
    util = require('../util');

var form = {
  "meta": {
    "id": "TEST"
  },
  "fields": [
    {
      "id": "name",
      "name": "Name",
      "type": "string"
    },
    {
      "id": "address",
      "name": "Address",
      "type": "fields",
      "fields": [
        {
          "id": "street",
          "name": "Street",
          "type": "string"
        },
        {
          "id": "city",
          "name": "City",
          "type": "string"
        }
      ]
    }
  ]
};

exports['simple nesting'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser
      .fill('name', 'Barack')
      .fill('address.street', '1600 Pennsylvania Ave')
      .fill('address.city', 'Washington, DC')
      .pressButton('button');
  }, function(browser) {
    util.assert_result(browser, {
      "name": "Barack",
      "address": {
        "street": "1600 Pennsylvania Ave",
        "city": "Washington, DC"
      }
    });
  }, callback);
};

// TODO: nested repetition, repetitive nesting, defaults, recursively nested fields