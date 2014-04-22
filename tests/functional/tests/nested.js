var assert = require('assert'),
    util = require('../util');

exports['simple nesting'] = function(test, callback) {

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

exports['recursive nesting'] = function(test, callback) {

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
            "type": "fields",
            "fields": [
              {
                "id": "line1",
                "type": "string"
              },
              {
                "id": "line2",
                "type": "string"
              }
            ]
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
  
  test.run(form, function(browser) {
    return browser
      .fill('name', 'Barack')
      .fill('address.street.line1', '1600')
      .fill('address.street.line2', 'Pennsylvania Ave')
      .fill('address.city', 'Washington, DC')
      .pressButton('button');
  }, function(browser) {
    util.assert_result(browser, {
      "name": "Barack",
      "address": {
        "street": {
          "line1": "1600",
          "line2": "Pennsylvania Ave"
        },
        "city": "Washington, DC"
      }
    });
  }, callback);
};

exports['nesting defaults'] = function(test, callback) {

  var form = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "name",
        "name": "Name",
        "type": "string",
        "default": "Barack"
      },
      {
        "id": "address",
        "name": "Address",
        "type": "fields",
        "fields": [
          {
            "id": "street",
            "name": "Street",
            "type": "string",
            "default": "1600 Pennsylvania Ave"
          },
          {
            "id": "city",
            "name": "City",
            "type": "string",
            "default": "Washington, DC"
          }
        ]
      }
    ]
  };

  test.run(form, null, function(browser) {
    assert.equal(browser.query('.field-id-street input').value, '1600 Pennsylvania Ave');
  }, callback);
};
// TODO: nested repetition, repetitive nesting, binding