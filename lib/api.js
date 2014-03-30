/**
 * Medic Forms: A flexible data collection system
 *
 * Copyright 2013-2014 David Brown <david@medicmobile.org>
 * Copyright 2013-2014 Medic Mobile, Inc. <hello@medicmobile.org>
 * All rights reserved.
 *
 * Medic Forms is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation, version three.
 *
 * You should have received a copy of version three of the GNU General
 * Public License along with this file. If you did not, you can download a
 * copy from http://www.gnu.org/licenses/.
 *
 * Medic Forms is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
 * Public License for more details.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL DAVID BROWN OR MEDIC MOBILE BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var tv4 = require('tv4'),
    async = require('async'),
    _ = require('underscore'),
    schemas = require('./schemas/all'),
    input_validator = require('./input'),
    form_validator = require('./validate'),
    form_normalizer = require('./normalize'),
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

    /* Member variables */
    self._forms = false;
    self._options = options;

    _fn.call(self, {
      valid: true, instance: self
    });

    return self;
  },


  /**
   * @name load:
   */
  load: function (_forms, _fn) {

    var self = this;
    var forms = (_forms || []);

    /* Allow JSON */
    if (_.isString(forms)) {
      try {
        forms = JSON.parse(forms);
      } catch (_e) {
        return _fn.call(self, {
          valid: false, exception: _e,
          error: 'Invalid or malformed JSON string'
        });
      }
    }

    /* Type check */
    if (!_.isArray(forms)) {
      return _fn.call(self, {
        result: false,
        phase: 'initialization',
        error: 'Top-level element must be an array'
      });
    }

    /* Form loading pipeline:
     *   We have a mix of synchronous and asynchronous steps;
     *   we've chosen to manage each step as if it's asynchronous
     *   so that each step of the process is easier to follow. */

    async.waterfall([

      function (_next_fn) {

        /* Step 1: Reference rewriting
         *   For each form provided in `forms`, replace all `$ref`
         *   properties with the document fragment described by the
         *   property's value.  Replacement document fragment are
         *   found by interpreting the `$ref` property value as a
         *   JSON path expression. References must be limited to
         *   the current document; external references are errors. */

        try {

          /* Synchronous */
          var rv = reference_rewriter.rewrite(forms);

          if (!rv.valid) {
            return _fn.call(self, {
              valid: false,
              phase: 'rewrite', detail: rv,
              error: 'Invalid or malformed reference directive'
            });
          }

          /* Success */
          _next_fn.call(self);

        } catch (_e) {

          return _fn.call(self, {
            valid: false, phase: 'rewrite',
            exception: _e, error: 'Internal error'
          });
        }
      },

      function (_next_fn) {

        /* Step 2: Schema validation
         *   Ensure that the form definition conforms to our JSON
         *   schema; this schema describes the structure of JSON
         *   form definitions.  This step is responsible for a 
         *   large amount of the validation that's performed on
         *   form definitions; see the step below for exceptions. */

        try {

          /* Synchronous */
          var rv = tv4.validateResult(forms, schemas.core);

          if (!rv.valid) {
            return _fn.call(self, {
              valid: false, phase: 'schema',
              detail: rv.error, error: 'Form validation failure'
            });
          }

          /* Success */
          _next_fn.call(self);

        } catch (_e) {

          return _fn.call(self, {
            valid: false, phase: 'schema',
            exception: _e, error: 'Internal error'
          });
        }
      },

      function (_next_fn) {

        /* Step 3: Additional form validation
         *   This step implements any validation constraints that
         *   can't be easily expressed using JSON Schema. Code in
         *   this step *may* assume that input matches the schema in
         *   step #2, but typically doesn't if at all possible just
         *   in case there are usage errors somewhere in the library. */

        try {

          /* Asynchronous */
          form_validator.validate_all(forms, function (_rv) {

            if (!_rv.valid) {
              return _fn.call(self, {
                valid: false, phase: 'validate',
                detail: _rv, error: 'Form validation failure'
              });
            }

            _next_fn.call(self);
          });

        } catch (_e) {

          /* Caveat:
           *   This won't catch anything that happens in the asynchronous
           *   portion of the form validator, but it likely will catch
           *   simple usage/type errors; we'll leave it here for now. */

          return _fn.call(self, {
            valid: false, phase: 'validate',
            exception: _e, error: 'Internal error'
          });
        }
      },

      function (_next_fn) {

        /* Step 4: Form normalization
         *   This step coerces the fully-validated form definition
         *   into a common "preferred" format, with each property
         *   represented in its most verbose form (e.g. with a default
         *   value if it was omitted from the original input, or with
         *   unconstrained values like -Infinity and +Infinity). This
         *   step isn't allowed to raise errors; any cases that could
         *   result in an error should be handled in the corresponding
         *   validation function.  See `lib/normalize.js` for details. */

        try {

          /* Synchronous */
          forms = form_normalizer.normalize_all(forms);

          /* Success */
          _next_fn.call(self);

        } catch (_e) {

          return _fn.call(self, {
            valid: false, phase: 'normalize',
            exception: _e, error: 'Internal error'
          });
        }
      }
    ], function (_err) {

      /* Store loaded forms */
      self._forms = forms;

      /* Indicate success */
      return _fn.call(self, {
        valid: true, result: forms
      });
    });

    return self;
  },


  /**
   * @name fill:
   */
  fill: function (_input, _fn) {

    var self = this;
    var input = (_input || []);

    if (!self._forms) {
      return _fn.call(self, {
        valid: false,
        error: 'Forms must be loaded before processing input'
      });
    }

    /* Allow JSON */
    if (_.isString(input)) {
      try {
        input = JSON.parse(input);
      } catch (_e) {
        return _fn.call(self, {
          valid: false, exception: _e,
          error: 'Invalid or malformed JSON string'
        });
      }
    }

    /* Type check */
    if (!util.is_plain_object(input)) {
      return _fn.call(self, {
        valid: false,
        error: 'Input must be a plain object'
      });
    }
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


/* vim: set ai ts=8 sts=2 sw=2 expandtab: */
