'use strict';

var handlebars = require('handlebars');


handlebars.registerHelper(
  'row', function (_field, _error, _validation, _options) {
    handlebars.createFrame(_options.data || {}).elementId = Math.random();
    return (
      '<li ' + _get_row_class_attribute(_field, _validation) + '>' + 
          _options.fn(this) + 
      '</li>'
    );
});


/**
 * @name _get_row_class_attribute:
 */
var _get_row_class_attribute = function (_field, _validation) {

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

  return 'class="' + classes.join(' ') + '"';
};
