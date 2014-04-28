var assert = require('assert');

exports['render defaults'] = function (test, callback) {

  var form = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "name",
        "name": "Patient Name",
        "type": "string",
        "default": "Curious George"
      }
    ]
  };


  test.run(form, null, function (browser) {

    assert.equal(
      browser.query('.field-id-name input').value,
        'Curious George'
    );

  }, callback);
};


// TODO scripted defaults

