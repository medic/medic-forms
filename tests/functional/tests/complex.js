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
    },
    {
      "id": "lmp",
      "name": "LMP",
      "type": "date"
    },
    {
      "id": "seen",
      "name": "Appointment Time",
      "type": "timestamp"
    }/*,

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
      .fill('lmp', 'yesterday')
      .fill('seen', 'noon today')
      .pressButton('button');
  }, function(browser) {
    _assertError(browser, 'age', 'Value must be an integer');
    _assertError(browser, 'cholesterol', 'Value must be numeric');
    _assertError(browser, 'email', 'Value must be a valid email address');
    _assertError(browser, 'lmp', 'Value must be a valid date');
    _assertError(browser, 'seen', 'Value must be a valid timestamp');
  }, callback);
};

exports['valid submission'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser
      // .fill('age', '21')
      // .fill('cholesterol', '11.5')
      .fill('email', 'gareth@medicmobile.org')
      .select('sex', '2')
      .fill('lmp', '2014-04-14')
      .fill('seen', '2014-01-14T14:03:55.554Z')
      .pressButton('button');
  }, function(browser) {
    assert.deepEqual(_serialize(browser), {
      email: 'gareth@medicmobile.org',
      sex: '2',
      lmp: '2014-04-14',
      seen: '2014-01-14T14:03:55.554Z'
    });
  }, callback);
};

var _serialize = function (browser) {
  var serialized = browser.text('#serialized');
  if (!serialized) {
    assert.fail('Submission was not valid:' + 
      browser.query('form').innerHTML);
  }
  return JSON.parse(serialized);
};

var _assertError = function(browser, id, error) {
  var elemId = '#row-' + id;
  assert.equal(browser.query(elemId).className, 'error');
  assert.equal(
    browser.query(elemId + '.error span.error-message').innerHTML, 
    error
  );
};