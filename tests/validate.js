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
    _ = require('underscore'),
    util = require('./include/util'),
    fixtures = require('./fixtures/compiled'),
    form_validator = require('../lib/validate');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture) {

  var forms = _fixture.forms;
  var label = 'must ' + (_fixture.valid ? '' : 'not ') + 'validate';

  /* Paranoia:
   *   These assertions test the test fixtures. */
  _test.ok(
    _.isArray(forms), 'must provide an array for the `forms` property'
  );

  form_validator.validate_all(forms, function (_rv) {

    /* Check top-level validity:
     *   This is an all-or-nothing result for all form
     *   definitions provided by the current test fixture. */

    _test.equal(_rv.valid, _fixture.valid, label);

    /* Check individual form validity:
     *   We only do this if the `all` parameter is present, indicating
     *   that the `valid` property should match the validity of *all*
     *   forms in the test fixture, not just the top-level result. */

    if (_fixture.all) {

      var detail = _rv.detail;

      _test.equal(
        forms.length, detail.length,
          'must have one detailed result for every form'
      );

      for (var i = 0, len = detail.length; i < len; ++i) {
        _test.equal(
          detail[i].valid, _fixture.valid, label + ' at offset ' + i
        );
      }
    }

    /* Finished */
    _test.done();
  });
}


/* Tests */
util.make_tests(
  'forms', exports,
    fixtures.validate.forms, _assert
);
util.make_tests(
  'fields', exports,
    fixtures.validate.fields, _assert
);
util.make_tests(
  'select-lists', exports,
    fixtures.validate.select_lists, _assert
);

