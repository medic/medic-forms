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
            "items": [
              ["string","String"],
              ["integer","Integer"],
              ["number","Number"],
              ["select","Select"],
              ["email","Email"],
              ["json","JSON"]
            ],
            "required": true
          },
          {
            "id": "values",
            "name": "Values",
            "type": "fields",
            "repeat": true,
            "fields": [
              {
                "id": "values-key",
                "name": "Value",
                "type": "string"
              },
              {
                "id": "values-label",
                "name": "Display Name",
                "type": "string"
              }
            ],
            "conditions": {
              "structured": {
                "fields.type": "select"
              }
            }
          },
          {
            "id": "default",
            "name": "Default Value",
            "type": "string"
          },
          {
            "id": "required",
            "name": "Required",
            "type": "fields",
            "fields": [
              {
                "id": "required-type",
                "name": "Type",
                "type": "select",
                "default": "boolean",
                "items": [
                  ["boolean","Boolean"],
                  ["script","Scripted"]
                ]
              },
              {
                "id": "required-boolean",
                "name": "Boolean",
                "type": "boolean",
                "conditions": {
                  "structured": {
                    "fields.required.required-type": "boolean"
                  }
                }
              },
              {
                "id": "required-script",
                "name": "Script",
                "type": "string",
                "required": true,
                "conditions": {
                  "structured": {
                    "fields.required.required-type": "script"
                  }
                }
              }
            ]
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
                "default": "none",
                "items": [
                  ["none","None"],
                  ["minimum","Minimum"],
                  ["maximum","Maximum"],
                  ["between","Between"],
                  ["script","Scripted"]
                ]
              },
              {
                "id": "repeat-min",
                "name": "Minimum",
                "type": "integer",
                "required": true,
                "conditions": {
                  "structured": {
                    "fields.repeat.repeat-type": ["minimum","between"]
                  }
                }
              },
              {
                "id": "repeat-max",
                "name": "Maximum",
                "type": "integer",
                "required": true,
                "range": [1],
                "validations": {
                  "javascript": {
                    "greaterThanMin": "return ((parseInt(inputs.fields[repeatIndex.fields].repeat['repeat-min']) || 0) <= (parseInt(input) || Infinity))"
                  }
                },
                "conditions": {
                  "structured": {
                    "fields.repeat.repeat-type": ["maximum","between"]
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
                    "fields.repeat.repeat-type": "script"
                  }
                }
              }
            ]
          },
          {
            "id": "conditions",
            "name": "Conditions",
            "type": "fields",
            "fields": [
              {
                "id": "conditions-operator",
                "name": "Operator",
                "type": "select",
                "default": "&&",
                "items": [
                  ["&&","And"],
                  ["||","Or"]
                ]
              },
              {
                "id": "conditions-structured",
                "name": "Structured",
                "type": "fields",
                "repeat": true,
                "fields": [
                  {
                    "id": "conditions-structured-field",
                    "name": "Field Path",
                    "type": "string"
                  },
                  {
                    "id": "conditions-structured-value",
                    "name": "Expected Value",
                    "type": "string"
                  }
                ]
              },
              {
                "id": "conditions-javascript",
                "name": "Scripted",
                "type": "string",
                "repeat": true
              }
            ]
          },
          {
            "id": "validation-section",
            "name": "Validations",
            "type": "fields",
            "fields": [
              {
                "id": "length",
                "name": "Length",
                "type": "fields",
                "fields": [
                  {
                    "id": "length-type",
                    "name": "Length Validation",
                    "type": "select",
                    "default": "none",
                    "items": [
                      ["none","None"],
                      ["minimum","Minimum"],
                      ["maximum","Maximum"],
                      ["between","Between"],
                      ["script","Scripted"]
                    ]
                  },
                  {
                    "id": "length-minimum",
                    "name": "Minimum",
                    "type": "number",
                    "conditions": {
                      "structured": {
                        "fields.validation-section.length.length-type": ["minimum","between"]
                      }
                    }
                  },
                  {
                    "id": "length-maximum",
                    "name": "Maximum",
                    "type": "number",
                    "conditions": {
                      "structured": {
                        "fields.validation-section.length.length-type": ["maximum","between"]
                      }
                    }
                  },
                  {
                    "id": "length-script",
                    "name": "Script",
                    "type": "string",
                    "conditions": {
                      "structured": {
                        "fields.validation-section.length.length-type": ["script"]
                      }
                    }
                  }
                ],
                "conditions": {
                  "structured": {
                    "fields.type": ["string","email","json"]
                  }
                }
              },
              {
                "id": "range",
                "name": "Range Validation",
                "type": "fields",
                "fields": [
                  {
                    "id": "range-type",
                    "name": "Valid Range",
                    "type": "select",
                    "default": "none",
                    "items": [
                      ["none","None"],
                      ["minimum","Minimum"],
                      ["maximum","Maximum"],
                      ["between","Between"],
                      ["script","Scripted"]
                    ]
                  },
                  {
                    "id": "range-minimum",
                    "name": "Minimum",
                    "type": "number",
                    "conditions": {
                      "structured": {
                        "fields.validation-section.range.range-type": ["minimum","between"]
                      }
                    }
                  },
                  {
                    "id": "range-maximum",
                    "name": "Maximum",
                    "type": "number",
                    "conditions": {
                      "structured": {
                        "fields.validation-section.range.range-type": ["maximum","between"]
                      }
                    }
                  },
                  {
                    "id": "range-script",
                    "name": "Script",
                    "type": "string",
                    "conditions": {
                      "structured": {
                        "fields.validation-section.range.range-type": ["script"]
                      }
                    }
                  }
                ],
                "conditions": {
                  "structured": {
                    "fields.type": ["integer","number"]
                  }
                }
              },
              {
                "id": "validations",
                "name": "Custom Validations",
                "type": "fields",
                "fields": [
                  {
                    "id": "validations-operator",
                    "name": "Operator",
                    "type": "select",
                    "default": "&&",
                    "items": [
                      ["&&","And"],
                      ["||","Or"]
                    ]
                  },
                  {
                    "id": "validations-javascript",
                    "name": "Scripted",
                    "type": "string",
                    "repeat": true
                  },
                  {
                    "id": "validations-registered",
                    "name": "Registered",
                    "type": "string",
                    "repeat": true
                  }
                ]
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
    prefix = prefix || '';
    var index = parseInt(name);
    if (!isNaN(index)) {
      // +1 because css is 1 based, +1 to skip the template
      return prefix + ':nth-of-type(' + (index + 2) + ')';
    }
    return prefix + ' .field-id-' + name;
  }

  var _setSkipped = function(row, skip) {
    row.toggleClass('skipped', skip);
    var parentList = row.closest('ul');
    if (parentList.hasClass('repeat')) {
      parentList.closest('li').toggleClass('skipped', skip);
      parentList.find('li.skipped').toggleClass('skipped', skip);
    }
  };

  var _validationResult = function(details, prefix) {
    for (var field in details) {
      var detail = details[field];
      var fieldName = _getFieldName(prefix, field);
      var row = $(fieldName);
      _setSkipped(row, detail.skipped === true);
      if (!detail.skipped) {
        if (detail.detail && !detail.error) {
          _validationResult(detail.detail, fieldName);
        } else {
          if (!detail.valid) {
            row.addClass('error');
            row.prepend('<span class="error-message">' + detail.error + '</span>');
          }
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