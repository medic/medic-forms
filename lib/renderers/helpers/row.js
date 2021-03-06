'use strict';

var handlebars = require('handlebars');

var rowTemplate = handlebars.compile(
  '<li class="{{#each classes}}{{this}} {{/each}}">' +
    '{{{content}}}' +
    '{{#if field.repeat}}<a href="#" class="delete-item">delete</a>{{/if}}' +
  '</li>'
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
      content: _options.fn(this, { data: data }),
      field: _field
    });
  }
);

/**
 * @name _get_row_classes:
 */
var _get_row_classes = function (_field, _validation) {

  _validation = _validation || {};

  var classes = [ 
    'field-id-' + _field.id,
    'field-type-' + _field.type
  ];

  if (_validation.error) {
    classes.push('error');
  }

  if (_field.required) {
    classes.push('required');
  }

  if (_validation.skipped) {
    classes.push('skipped');
  }

  if (_validation.template) {
    classes.push('template');
  }

  return classes;
};
