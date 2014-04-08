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
    render = require('../lib/render'),
    test_utils = require('./include/util'),
    fixtures = require('./fixtures/compiled');

/**
 * @name _assert
 */
var _assert = function (_test, _fixture) {
  _test.expect(1);
  var actual = render.render_all(
    _fixture.form, _fixture.values, _fixture.validation
  );
  _test.same(actual, _fixture.expect);
  _test.done();
}

var stringRenderer = {
  applies_to: function(field) {
    return field.type === 'string'
  },
  render: function(field, value, validation) {
    var result = '<field>';
    if (validation && !validation.valid) {
      result += '<error>' + validation.error + '</error>';
    }
    result += '<id>' + field.id + '</id>';
    if (value) {
      result += '<value>' + value + '</value>';
    }
    result += '</field>';
    return result;
  }
};

render.set_renderers({
  formTemplate: '<form>{{{content}}}</form>',
  modules: [stringRenderer]
});

/* Tests */
test_utils.make_tests(
  'render', exports, fixtures.render.input, _assert
);
