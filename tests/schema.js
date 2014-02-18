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
    _ = require('underscore'),
    util = require('./include/util'),
    schemas = require('../lib/schemas/all'),
    fixtures = require('./fixtures/compiled'),
    reference_rewriter = require('../lib/reference');


/**
 * @name _assert
 */
var _assert = function(_test, _fixture, _value, _valid) {

  _test.expect(2);

  /* Rewrite references */
  var rv = reference_rewriter.rewrite_all(_fixture.content);

  _test.ok(
    rv.valid, 'Rewriting must succeed'
  );

  /* Validate against schema */
  rv = tv4.validateResult(_fixture.content, schemas.core);

  _test.equal(
    rv.valid, _valid, 
      ' must ' + (!_valid ? 'not ' : '') + 'validate'
  );

  _test.done();
}

util.make_tests(
  'valid', exports,
    fixtures.schema.valid, _assert, [ true ]
);

util.make_tests(
  'invalid', exports,
    fixtures.schema.invalid, _assert, [ false ]
);

