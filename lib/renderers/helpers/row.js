'use strict';

var handlebars = require('handlebars');

var rowTemplate = handlebars.compile(
  '<li class="{{#each classes}}{{this}} {{/each}}">{{{content}}}</li>'
);

/**
 * Used for generating ids that are unique for the life of this object.
 */
var idGenerator = function() {

  var _next = 0;

  return {
    /**
     * @name: next
     *    Get the next unique id.
     */
    next: function () {
      return _next++;
    }
  };

}();

handlebars.registerHelper(
  'row', function (_field, _error, _validation, _options) {
    var data = handlebars.createFrame(_options.data || {});
    data.elementId = 'field-' + idGenerator.next();
    return rowTemplate({
      classes: _get_row_classes(_field, _validation),
      content: _options.fn(this, { data: data })
    });
  }
);

/**
 * @name _get_row_classes:
 */
var _get_row_classes = function (_field, _validation) {

  var classes = [ 
    'field-id-' + _field.id,
    'field-type-' + _field.type
  ];

  if (_validation && _validation.error) {
    classes.push('error');
  }

  if (_field.required) {
    classes.push('required');
  }

  if (_validation && _validation.skipped) {
    classes.push('skipped');
  }

  return classes;
};
