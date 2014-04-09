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
      "required": true
    },
    {
      "id": "pokemon",
      "name": "Favourite Pokemon",
      "type": "string",
      "default": "Pikachu"
    }
  ]
};

exports['valid form render'] = function(test, callback) {
  test.run(form, null, function(browser) {
    assert.equal(browser.query('#row-name input').value, '');
    assert.equal(browser.query('#row-name').className, 'required');
    assert.equal(browser.query('#row-pokemon input').value, 'Pikachu');
    assert.equal(browser.query('#row-pokemon').className, '');
  }, callback);
};

exports['valid form submission'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser
      .fill('name', 'gareth')
      .fill('pokemon', 'Diancie')
      .pressButton('button');
  }, function(browser) {
    var serialized = browser.text('#serialized');
    assert.deepEqual(JSON.parse(serialized), {name: 'gareth', pokemon: 'Diancie'});
  }, callback);
};

exports['missing required field'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser
      .fill('pokemon', 'Diancie')
      .pressButton('button');
  }, function(browser) {
    assert.equal(
      browser.query('#row-name.error span.error-message').innerHTML, 
      'Value must be a single plain-text string'
    );
    assert.equal(browser.query('#row-pokemon input').value, 'Diancie');
  }, callback);
};
