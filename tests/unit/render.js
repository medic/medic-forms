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
    render = require('../../lib/render'),
    test_utils = require('../include/util'),
    fixtures = require('./fixtures/compiled');


/**
 * @name _assert
 */
var _assert = function (_test, _fixture) {

  _test.expect(1);

  var actual = render.render_form(
    _fixture.form, _fixture.values,
      _fixture.validation, _fixture.options
  );

  _test.same(actual, _fixture.expect);
  _test.done();
};


/**
 * @name stringRenderer
 */
var stringRenderer = {

  /**
   * @name applies_to
   */
  applies_to: function (_field) {

    return (_field.type === 'string')
  },

  /**
   * @name render
   */
  render: function (_options) {

    var result = '<field>';

    var field = _options.field;
    var value = _options.value;
    var validation = _options.validation;

    if (validation && validation.error) {
      result += '<error>' + validation.error + '</error>';
    }
    result += '<id>' + field.id + '</id>';

    if (field.required) {
      result += '<required/>';
    }

    if (value) {
      result += '<value>' + value + '</value>';
    }

    result += '</field>';
    return result;
  }
};


/**
 * @name textareaRenderer
 */
var textareaRenderer = {

  id: 'textarea',

  /**
   * @name applies_to
   */
  applies_to: function (_field) {

    return false;
  },

  /**
   * @name render
   */
  render: function (_options) {

    return '<textarea><id>' + _options.field.id + '</id></textarea>';
  }
};


/**
 * @name formRenderer
 */
var formRenderer = {

  /**
   * @name applies_to
   */
  applies_to: function (_form) {

    return !!_form.meta;
  },

  /**
   * @name render
   */
  render: function (_content) {

    return '<form>' + _content.content + '</form>';
  }
};


/* Setup mock renderers */
render.set_renderers({
  modules: [ stringRenderer, textareaRenderer, formRenderer ]
});


/* Run tests */
test_utils.make_tests(
  'render', exports, fixtures.render.input, _assert
);

