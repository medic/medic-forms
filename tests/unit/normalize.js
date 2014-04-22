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
    clone = require('clone'),
    _ = require('underscore'),
    jsdump = require('jsDump'),
    api = require('../../lib/api'),
    test_utils = require('../include/util'),
    fixtures = require('./fixtures/compiled'),
    normalizer = require('../../lib/normalize');


/**
 * @name check_fields:
 */
var check_fields = function (_test, _fields,
                             _expected, _properties, _context) {

  var context = (_context || []);

  if (!_.isArray(_expected)) {
    _expected = [ _expected ];
  }

  if (!_.isArray(_fields)) {
    _fields = [ _fields ];
  }

  /* For each checkable object in scope */
  for (var i = 0, len = _expected.length; i < len; ++i) {

    var field = _fields[i];
    var expected = _expected[i];

    if (expected.type == 'fields') {

      check_fields(
        _test, (field.fields || []), (expected.fields || []),
          _properties, context.concat([ i ])
      );

    } else {

      var message = (
        'properties ' + JSON.stringify(_properties) + ' must match' +
          (context.length > 0 ?
            ' along subfield path ' + JSON.stringify(context) : '')
      );

      _test.ok(
        test_utils.compare_partial(expected, field, _properties), message
      );
    }
  }
};


/**
 * @name _assert
 */
var _assert = function(_test, _fixture, _value, _scope) {

  var from = _fixture.from, to = _fixture.to;

  _test.ok(_.isObject(to), 'must have `to` property');
  _test.ok(_.isObject(from), 'must have `from` property');

  normalizer.normalize_all(from);

  /* For each form */
  for (var i = 0, len = from.length; i < len; ++i) {
    check_fields(
      _test, (from[i][_scope] || []),
        (to[i][_scope] || []), _fixture.check
    );
  }

  /* Check validity of normalized form:
   *   We want to make sure that all of our normalization output
   *   also validates properly and conforms to the JSON schema. */

  var forms = _.map(from, function (_object) {
    return _.extend(clone(_object), { meta: { id: 'f' } });
  });

  api.create().load(forms, function (_rv) {
    _test.ok(_rv.valid, 'normalized form must be loadable');
    _test.done();
  });
}


/* Tests */
test_utils.make_tests(
  'field-identifiers', exports,
    fixtures.normalize.field_identifiers, _assert, [ 'fields' ]
);
test_utils.make_tests(
  'field-properties', exports,
    fixtures.normalize.field_properties, _assert, [ 'fields' ]
);
test_utils.make_tests(
  'field-select-lists', exports,
    fixtures.normalize.field_select_lists, _assert, [ 'fields' ]
);
test_utils.make_tests(
  'form-identifiers', exports,
    fixtures.normalize.form_identifiers, _assert, [ 'meta' ]
);
test_utils.make_tests(
  'field-properties', exports,
    fixtures.normalize.form_properties, _assert, [ 'meta' ]
);
test_utils.make_tests(
  'field-validations', exports,
    fixtures.normalize.field_validations, _assert, [ 'fields' ]
);
test_utils.make_tests(
  'field-conditions', exports,
    fixtures.normalize.field_conditions, _assert, [ 'fields' ]
);

