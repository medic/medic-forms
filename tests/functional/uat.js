var api = require('../../lib/api').create();

$(function() {

  var definitions = {};
  definitions['Single string field'] = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "name",
        "name": "Patient Name",
        "type": "string"
      }
    ]
  };
  definitions['Repeating string field'] = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "name",
        "name": "Patient Name",
        "type": "string",
        "repeat": true
      }
    ]
  };
  definitions['Required string field'] = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "name",
        "name": "Patient Name",
        "type": "string",
        "required": true
      }
    ]
  };
  definitions['Nested string fields'] = {
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
  definitions['Repeating nested string fields'] = {
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
  definitions['Structured conditions'] = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "title",
        "name": "Title",
        "type": "string"
      },
      {
        "id": "noskip",
        "name": "Shows when Title is blank",
        "type": "string",
        "conditions": {
          "structured": {
            "title": ""
          }
        }
      },
      {
        "id": "skip",
        "name": "Shows when Title is 2",
        "type": "string",
        "conditions": {
          "structured": {
            "title": "2"
          }
        }
      }
    ]
  };
  definitions['Christmas tree'] = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "string",
        "name": "String",
        "type": "string"
      },
      {
        "id": "stringshort",
        "name": "String shorter than 10 characters",
        "type": "string",
        "length": [0, 10]
      },
      {
        "id": "stringlong",
        "name": "String longer than 10 characters",
        "type": "string",
        "length": [10]
      },
      {
        "id": "email",
        "name": "Email",
        "type": "email"
      },
      {
        "id": "integer",
        "name": "Integer",
        "type": "integer"
      },
      {
        "id": "number",
        "name": "Number",
        "type": "number",
        "required": true
      },
      {
        "id": "select",
        "name": "Select",
        "type": "select",
        "items": ["one", "two", "three"]
      }
    ]
  };

  $('body').on('click', '#shortcuts a', function (e) {

    e.preventDefault();
    e.stopPropagation();

    var form = definitions[$(e.target).text()];
    $('[name=formDefinition]').val(JSON.stringify(form, null, '  '));
  });

  var _validate = function (_form, _options, _cb) {
    var definition = _form.data('definition');
    api.load([definition], function(_loaded) {
      var input = api.parse(_form.serialize(), 'httppost');
      api.fill(input.result, _options, function(_filled) {
        _form.find('.error-message').remove();
        if (!_filled.valid) {
          for (var field in _filled.detail) {
            var detail = _filled.detail[field];
            var row = $('[name=' + field + ']').closest('li');
            if (!detail.valid) {
              row.prepend('<span class="error-message">' + detail.error + '</span>');
            }
          }
        }
        if (_cb) {
          _cb(_filled);
        }
      });
    });
  };

  $('body').on('click', 'button', function (e) {

    e.preventDefault();
    e.stopPropagation();

    var form = $(e.target).closest('form');
    _validate(form, {}, function(_result) {
      if (_result.valid) {
        form.submit();
      }
    });

  });

  $('body').on('change', 'form', function (e) {

    var form = $(e.target).closest('form');
    var options = {ignore_required: true};
    _validate(form, options);

  });

  for (definition in definitions) {
    $('#shortcuts').append('<li><a href="#">' + definition + '</a></li>');
  }

});