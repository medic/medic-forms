
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
      return self.load(options.load, _fn);
    }

    return _fn.call(self);
  },

  /**
   * @name load:
   */
  load: function (_forms, _fn) {

    var forms = (
      _.isString(_forms) ?
        JSON.parse(_forms) : _forms
    );

    if (!_.isArray(forms)) {
      return _fn.call(this, {
        result: false,
        phase: 'initialization',
        error: 'List of forms to load must be an array'
      });
    }

    /* Step 1: Reference rewriting
     *   For each form provided in `forms`, replace all `$ref` properties
     *   with the document fragment described by the property's value.
     *   Replacement document fragment are found by interpreting the `$ref`
     *   property value as a JSON path expression. References must be
     *   limited to the current document; external references are errors. */

    try {

      var rv = reference_rewriter.rewrite(forms);

      if (!_.isArray(rv)) {
        throw new Error('Failed to process one or more $ref directives');
      }

    } catch (_e) {

      if (!rv) {
        return _fn.call(this, {
          valid: false, phase: 'rewriting',
          error: (_e.message || 'Unknown exception')
        });
      }
    }

    /* Step 2: Schema validation
     *   Ensure that the form definition conforms to our JSON schema;
     *   this schema describes the structure of JSON form definitions.
     *   This step is responsible for a large amount of the validation
     *   that's performed on form definitions; see below for exceptions. */
    
    /* Step 3: Additional form validation
     *   This step implements any validation constraints that can't be
     *   easily expressed using JSON Schema. Code in this step may assume
     *   that input matches the schema in step #2, but typically doesn't
     *   if at all possible just in case there are usage errors elsewhere. */
    
    /* Step 4: Form normalization
     *   This step coerces the fully-validated form definition in to a
     *   common "preferred" format, with each property represented in its
     *   most verbose form (e.g. with a default value if it was omitted
     *   from the original input, or with unconstrained values like
     *   -Infinity and +Infinity). See `lib/normalize.js` for details. */

    return this;
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

