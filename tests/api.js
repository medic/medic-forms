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

var fs = require('fs'),
    async = require('async'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    api = require('../lib/api'),
    util = require('../lib/util'),
    test_utils = require('./include/util'),
    fixtures = require('./fixtures/compiled');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture) {

  var fixtures = _fixture.fixtures;
  var expect = _fixture.expect;

  _test.ok(
    util.is_plain_object(fixtures),
      'must have valid `fixtures` property'
  );

  _test.ok(
    util.is_plain_object(expect),
      'must have valid `expect` property'
  );

  _test.ok(
    _.isArray(fixtures.forms),
      'must have valid `fixtures.forms` property'
  );

  _test.ok(
    util.is_plain_object(expect.load),
      'must have valid `expect.load` property'
  );

  _test.ok(
    _.isArray(fixtures.input),
      'must have valid `fixtures.input` property'
  );

  _test.ok(
    _.isArray(expect.fill),
      'must have valid `expect.fill` property'
  );

  /* Test API */
  return async.waterfall([

    /* Test `create` API */
    function (_next_fn) {

      api.create({}, function (_rv) {

        /* Sanity checks */
        _test.ok(_.isObject(this), 'must initialize properly');
        _test.ok(_.isObject(_rv), 'must yield a result object');

        return _next_fn(null, this);
      });
    },

    /* Test `load` API */
    function (_api, _next_fn) {

      /* API: load a form */
      _api.load(fixtures.forms, function (_rv) {

        _test.ok(
          test_utils.is_recursive_subset(expect.load, _rv),
            'should produce expected `load` result object'
        );

        return _next_fn(null, _api);
      });
    },

    /* Test `fill` API */
    function (_api, _next_fn) {

      /* Offset */
      var i = 0;

      /* One at a time */
      async.eachSeries(

        /* Arguments */
        fixtures.input,

        /* Per-item function */
        function (_input, _continue_fn) {

          /* API: apply input to a form */
          _api.fill(_input, function (_rv) {

            _test.ok(
              test_utils.is_recursive_subset(expect.fill[i++], _rv),
                'should produce expected `fill` result object'
            );

            return _continue_fn();
          });
        },

        /* Completion */
        function () {
          return _next_fn();
        }
      );
    }

  ], function (_err) {

    /* Finished */
    _test.done();
  });
  
}

/* Tests */
test_utils.make_tests(
  'form-identifiers',
    exports, fixtures.api.form_identifiers, _assert
);

test_utils.make_tests(
  'form-properties',
    exports, fixtures.api.form_properties, _assert
);

test_utils.make_tests(
  'form-repetition',
    exports, fixtures.api.form_repetition, _assert
);

test_utils.make_tests(
  'form-nested-fields',
    exports, fixtures.api.form_nested_fields, _assert
);

