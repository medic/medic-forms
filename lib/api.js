
'use strict';

var tv4 = require('tv4'),
    _ = require('underscore'),
    normalizer = require('./normalize'),
    input_validator = require('./input'),
    form_validator = require('./validate'),
    reference_rewriter = require('./reference');


/**
 * @name api:
 */
var api = {};


/**
 * @name v1:
 */
api.v1 = function () {

  return this.initialize.apply(this, arguments);
};


/**
 * @name v1:
 */
api.v1.prototype = {

  /**
   * @name initialize:
   */
  initialize: function (_options, _fn) {

    var self = this;
    var options = (_options || {});

    if (options.load) {
      return self.load(options.load, function (_result) {
        return _fn.call(self, _result);
      });
    }

    return _fn.call(self);
  },

  /**
   * @name load:
   */
  load: function (_forms, _fn) {

    var forms = (
      _.isString(_forms) ? JSON.parse(_forms) : _forms
    );

    if (!_.isArray(forms)) {
      return _fn.call(this, {
        result: 'error',
        message: 'List of forms to load must be a JSON or literal array'
      });
    }

    /* Step 1: Schema validation */
    var rv = tv4.validateResult();
  }

};


/**
 * @name create:
 *   A factory method for the forms API. The `_options` parameter
 *   is passed directly to the constructor, which in turn is passed
 *   on to the selected API's `initialize` method.
 */
exports.create = function (_options, _fn) {

  return new api.v1(_options, _fn);
};

