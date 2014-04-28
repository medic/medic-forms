
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
      "required": true
    },
    {
      "id": "pokemon",
      "name": "Favourite Pokemon",
      "type": "string",
      "default": "Pikachu"
    },
    {
      "id": "colour",
      "name": "Favourite Colour",
      "type": "select",
      "default": 1,
      "items": [
        [1, 'Red'],
        [2, 'Blue'],
        [3, 'Taupe']
      ]
    }
  ]
};


exports['test id generation'] = function (test, callback) {

  test.run(form, null, function (browser) {

    var inputId = browser.query('.field-id-name input').id;
    var labelFor = browser.query('.field-id-name label').getAttribute('for');

    assert.ok(inputId.trim() !== '');
    assert.equal(labelFor, inputId);

  }, callback);
};


exports['valid form render'] = function (test, callback) {

  test.run(form, null, function (browser) {

    assert.equal(browser.query('.field-id-name input').value, '');
    assert.ok(util.has_class(browser, 'name', 'required'));

    assert.equal(browser.query('.field-id-pokemon input').value, 'Pikachu');
    assert.ok(!util.has_class(browser, 'pokemon', 'required'));
    
    assert.equal(util.get_select_value(browser, 'colour'), '1');

  }, callback);
};


exports['valid form submission'] = function (test, callback) {

  test.run(form, function (browser) {

    return browser
      .fill('name', 'gareth')
      .fill('pokemon', 'Diancie')
      .pressButton('button');

  }, function (browser) {

    util.assert_result(browser, {
      name: 'gareth', 
      pokemon: 'Diancie',
      colour: '1'
    });

  }, callback);
};


exports['missing required field'] = function (test, callback) {

  test.run(form, function (browser) {

    return browser
      .fill('pokemon', 'Diancie')
      .select('colour', '2').pressButton('button');

  }, function (browser) {

    assert.ok(util.has_class(browser, 'name', 'error'));
    assert.ok(util.has_class(browser, 'name', 'required'));

    util.assert_error(
      browser, 
      'name', 
      'Value must be a single plain-text string'
    );

    assert.equal(browser.query('.field-id-pokemon input').value, 'Diancie');
    assert.equal(util.get_select_value(browser, 'colour'), '2');

  }, callback);
};

