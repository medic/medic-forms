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

  $('body').on('click', '#shortcuts a', function (e) {

    e.preventDefault();
    e.stopPropagation();

    var form = definitions[$(e.target).text()];
    $('[name=formDefinition]').val(JSON.stringify(form, null, '  '));
  });

  for (definition in definitions) {
    $('#shortcuts').append('<li><a href="#">' + definition + '</a></li>');
  }

});