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
        "id": "option",
        "name": "Contact Option",
        "type": "select",
        "items": ["email", "sms"]
      },
      {
        "id": "email",
        "name": "Email address",
        "type": "email",
        "conditions": {
          "structured": {
            "option": "1"
          }
        }
      },
      {
        "id": "phone",
        "name": "Phone number",
        "type": "string",
        "conditions": {
          "structured": {
            "option": "2"
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
      },
      {
        "id": "date",
        "name": "Date",
        "type": "date"
      },
      {
        "id": "timestamp",
        "name": "Timestamp",
        "type": "timestamp"
      }
    ]
  };
  definitions['Form builder'] = {
    "meta": {
      "id": "TEST"
    },
    "fields": [
      {
        "id": "fields",
        "name": "Fields",
        "type": "fields",
        "repeat": true,
        "fields": [
          {
            "id": "id",
            "name": "ID",
            "type": "string",
            "required": true
          },
          {
            "id": "type",
            "name": "Type",
            "type": "select",
            "items": ["string"],
            "required": true
          },
          {
            "id": "repeat",
            "name": "Repeat",
            "type": "fields",
            "fields": [
              {
                "id": "repeat-type",
                "name": "Type",
                "type": "select",
                "items": [
                  "none", "minimum", "maximum", "between", "script"
                ]
              },
              {
                "id": "repeat-min",
                "name": "Minimum",
                "type": "integer",
                "required": true,
                "conditions": {
                  "structured": {
                    "fields.repeat.repeat-type": ["2","4"]
                  }
                }
              },
              {
                "id": "repeat-max",
                "name": "Maximum",
                "type": "integer",
                "required": true,
                "conditions": {
                  "structured": {
                    "fields.repeat.repeat-type": ["3","4"]
                  }
                }
              },
              {
                "id": "repeat-script",
                "name": "Script",
                "type": "string",
                "required": true,
                "conditions": {
                  "structured": {
                    "fields.repeat.repeat-type": "5"
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  };

  $('body').on('click', '#shortcuts a', function (e) {

    e.preventDefault();
    e.stopPropagation();

    var form = definitions[$(e.target).text()];
    $('[name=formDefinition]').val(JSON.stringify(form, null, '  '));
  });

  var _getFieldName = function(prefix, name) {
    if (!prefix) {
      return name;
    }
    if (isNaN(parseInt(name))) {
      return prefix + '.' + name;
    }
    return prefix + '[' + name + ']';
  }

  var _validationResult = function(details, prefix) {
    for (var field in details) {
      var detail = details[field];
      var fieldName = _getFieldName(prefix, field);
      var row = $('[name="' + fieldName + '"]').closest('li');
      row.toggleClass('skipped', !!detail.skipped);
      if (!detail.skipped) {
        if (detail.detail) {
          _validationResult(detail.detail, fieldName);
        } else {
          if (!detail.valid) {
            row.addClass('error');
            row.prepend('<span class="error-message">' + detail.error + '</span>');
          }
          row.toggleClass('skipped', !!detail.skipped);
        }
      }
    }
  };

  var _validate = function (_form, _options, _cb) {
    var definition = _form.data('definition');
    api.load([definition], function(_loaded) {
      if (!_loaded.valid) {
        _clearErrors(_form);
        _form.prepend('<span class="error-message">' + _loaded.error + ': ' + _loaded.detail.message + '</span>');
        return;
      }
      var input = api.parse(_form.serialize(), 'httppost');
      api.fill(input.result, _options, function(_filled) {
        _clearErrors(_form);
        _validationResult(_filled.detail);
        if (_cb) {
          _cb(_filled);
        }
      });
    });
  };

  var _clearErrors = function(_form) {
    _form.find('.error-message').remove();
    _form.find('li.error').removeClass('error');
  }

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