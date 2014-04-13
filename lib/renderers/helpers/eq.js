'use strict';

var handlebars = require('handlebars');

handlebars.registerHelper('eq', function (_lhs, _rhs, _options) {
  if (_stringify(_lhs) === _stringify(_rhs)) {
    return _options.fn(this);
  }
  return _options.inverse(this);
});

var _stringify = function (_value) {
  return _value && _value.toString();
}