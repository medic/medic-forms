'use strict';

var _ = require('underscore'), 
    handlebars = require('handlebars');

handlebars.registerHelper('translate', function (_label) {
  if (_.isString(_label)) {
    return _label;
  } 
  // TODO actually translate based on users language
  return _label.un;
});
