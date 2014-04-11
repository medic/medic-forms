'use strict';

var handlebars = require('handlebars');

handlebars.registerHelper('row', function (_field, _error, _validation, _options) {
  return  '<li id="row-' + _field.id + '" ' + 
              _get_row_class_attribute(_field, _validation) + '>' + 
            _options.fn(this) + 
          '</li>';
});

var _get_row_class_attribute = function(_field, _validation) {
  var classes = [];
  if (_validation && _validation.error) {
    classes.push('error');
  }
  if (_field.required) {
    classes.push('required');
  }
  if (_validation && _validation.skipped) {
    classes.push('skipped');
  }
  return _get_attribute('class', classes.join(' '));
};

var _get_attribute = function(_name, _value) {
  return _value ? _name + '="' + _value + '"' : '';
};
