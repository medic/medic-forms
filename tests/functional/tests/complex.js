var assert = require('assert');

var form = {
  "meta": {
    "id": "TEST"
  },
  "fields": [
    {
      "id": "name",
      "name": "Patient Name",
      "type": "string"
    },
    {
      "id": "age",
      "name": "Age (years)",
      "type": "integer"
    },
    {
      "id": "cholesterol",
      "name": "Cholesterol",
      "type": "number"
    },
    {
      "id": "email",
      "name": "EMail Address",
      "type": "email"
    },
    {
      "id": "sex",
      "name": "Sex",
      "type": "select",
      "items": [
        [1, 'Right'],
        [2, 'Wrong']
      ]
    }/*,
    {
      "id": "lmp",
      "name": "LMP",
      "type": "date"
    },
    {
      "id": "seen",
      "name": "Appointment Time",
      "type": "timestamp"
    },

    {
      "id": "location",
      "name": "GPS Location",
      "type": "gps"
    },
    {
      "id": "bison",
      "name": "A Photo Of A Bison",
      "type": "image"
    }*/
  ]
};

exports['field type validation'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser
      .fill('age', 'twenty one')
      .fill('cholesterol', 'pretty high')
      .fill('email', 'gareth<at>medicmobile.org')
      .select('sex', '2')
      .pressButton('button');
  }, function(browser) {
    _assertError(browser, 'age', 'Value must be an integer');
    _assertError(browser, 'cholesterol', 'Value must be numeric');
    _assertError(browser, 'email', 'Value must be a valid email address');
  }, callback);
};

var _assertError = function(browser, id, error) {
  var elemId = '#row-' + id;
  assert.equal(browser.query(elemId).className, 'error');
  assert.equal(
    browser.query(elemId + '.error span.error-message').innerHTML, 
    error
  );
};