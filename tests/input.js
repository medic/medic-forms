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
    jsdump = require('jsDump'),
    util = require('./include/util'),
    input_validator = require('../lib/input'),
    fixtures = require('./fixtures/compiled');


/**
 * @name _assert:
 */
var _assert = function (_test, _fixture, _value) {

  var valid = _fixture.valid;
  var field = _fixture.field;
  var error = _fixture.error;
  var inputs = _fixture.inputs;
  var skipped = _fixture.skipped;

  /* Count expected assertions */
  _test.expect(error ? 3 : 2);

  /* Register native validation function */
  input_validator.register_validator('startsWithA', function (_input) {

    if (_input.charAt(0) === 'A') {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Input does not start with the letter A'
    };
  });

  /* Register native validation function */
  input_validator.register_validator('endsWithA', function (_input) {

    if (_input.charAt(_input.length - 1) === 'A') {
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Input does not end with the letter A'
    };
  });

  /* Set up validation context */
  var context = { inputs: inputs };

  /* Start test */
  input_validator.validate_any(

    /* Arguments */
    _value, field, context, {},
   
    /* Completion */
    function (_r) {

      _test.equal(
        _r.valid, valid, 
          _value + ' must ' + (valid ? '' : 'not ') + 'validate'
      );

      _test.equal(
        !_r.skipped, !skipped, 
          _value + ' must ' + (skipped ? '' : 'not ') + 'be skipped'
      );

      if (error) {
        _test.equal(_r.error, error);
      }

      _test.done();
    }
  );
};

util.make_tests(
  'field-types', exports,
    fixtures.input.field_types, _assert
);

util.make_tests(
  'field-properties', exports,
    fixtures.input.field_properties, _assert
);

