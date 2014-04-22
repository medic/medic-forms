
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
      "type": "string",
      "required": true
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


exports['simple nesting'] = function (test, callback) {

  test.run(form, function (browser) {

    return browser
      .fill('name', 'Barack')
      .fill('address.street', '1600 Pennsylvania Ave')
      .fill('address.city', 'Washington, DC')
      .pressButton('button');

  }, function (browser) {

    util.assert_result(browser, {
      "name": "Barack",
      "address": {
        "street": "1600 Pennsylvania Ave",
        "city": "Washington, DC"
      }
    });

  }, callback);
};


exports['recursive nesting'] = function (test, callback) {

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
  
  test.run(form, function (browser) {

    return browser
      .fill('name', 'Barack')
      .fill('address.street.line1', '1600')
      .fill('address.street.line2', 'Pennsylvania Ave')
      .fill('address.city', 'Washington, DC')
      .pressButton('button');

  }, function (browser) {

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


exports['nesting defaults'] = function (test, callback) {

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

  test.run(form, null, function (browser) {

    assert.equal(
      browser.query('.field-id-street input').value,
        '1600 Pennsylvania Ave'
    );

  }, callback);
};


exports['binding nested values'] = function (test, callback) {

  test.run(form, function (browser) {

    return browser
      .fill('address.street', '1600 Pennsylvania Ave')
      .fill('address.city', 'Washington, DC')
      .pressButton('button');

  }, function (browser) {

    assert.equal(
      browser.query('.field-id-street input').value,
        '1600 Pennsylvania Ave'
    );
    assert.equal(
      browser.query('.field-id-city input').value,
        'Washington, DC'
    );

  }, callback);
};


exports['nested fields can be repeated'] = function (test, callback) {

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
        "repeat": true,
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
  
  test.run(form, [

    function (browser) {
      return browser
        .clickLink('.repeat-id-address .add-item')
    },

    function (browser) {
      return browser
        .clickLink('.repeat-id-address .add-item')
    },

    function (browser) {
      return browser
        .fill('name', 'Barack')
        .fill('address[0].street', '1600 Pennsylvania Ave')
        .fill('address[0].city', 'Washington, DC. 20500')
        .fill('address[1].street', '730 12th St')
        .fill('address[1].city', 'Washington, DC. 20005')
        .pressButton('button');
    }

  ], function (browser) {

    util.assert_result(browser, {
      "name": "Barack",
      "address": [
        {
          "street": "1600 Pennsylvania Ave",
          "city": "Washington, DC. 20500"
        },
        {
          "street": "730 12th St",
          "city": "Washington, DC. 20005"
        }
      ]
    });

  }, callback);
};


exports['repeated fields can be nested'] = function (test, callback) {

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
            "type": "string",
            "repeat": true
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
  
  test.run(form, [

    function (browser) {
      return browser
        .clickLink('.repeat-id-street .add-item')
    },

    function (browser) {
      return browser
        .clickLink('.repeat-id-street .add-item')
    },

    function (browser) {
      return browser
        .fill('name', 'Barack')
        .fill('address.street[0]', '1600')
        .fill('address.street[1]', 'Pennsylvania Ave')
        .fill('address.city', 'Washington, DC')
        .pressButton('button');
    }

  ], function (browser) {
    util.assert_result(browser, {
      "name": "Barack",
      "address": {
        "street": ["1600", "Pennsylvania Ave"],
        "city": "Washington, DC"
      }
    });

  }, callback);
};
