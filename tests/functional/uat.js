$(function() {

  var definitions = {
    simple: {
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
    },
    repeating: {
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
    },
    required: {
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
    },
    nested: {
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
    }
  };

  $('body').on('click', '#shortcuts a', function (e) {

    e.preventDefault();
    e.stopPropagation();

    var form = definitions[$(e.target).data('definition')];
    $('[name=formDefinition]').val(JSON.stringify(form, null, '  '));
  });

});