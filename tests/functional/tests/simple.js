var assert = require('assert');

var form = {
  "meta": {
    "id": "TEST"
  },
  "fields": [{
    "id": "name",
    "name": "Patient Name",
    "type": "string",
    "required": true
  }]
};

exports['valid form'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser
      .fill('name', 'gareth')
      .pressButton('submit');
  }, function(browser) {
    var serialized = browser.text('#serialized');
    assert.deepEqual(JSON.parse(serialized), {name: 'gareth'});
  }, callback);
}

exports['missing required field'] = function(test, callback) {
  test.run(form, function(browser) {
    return browser
      .pressButton('submit');
  }, function(browser) {
    assert.equal(
      browser.query('div.row-name span.error').innerHTML, 
      'Value must be a single plain-text string'
    );
  }, callback);
}
