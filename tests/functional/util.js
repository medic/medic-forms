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

var assert = require('assert');

var get_row_class = exports.get_row_class = function(_id) {
  return '.field-id-' + _id;
};

var get_row = exports.get_row = function(_browser, _id) {
  return _browser.query(get_row_class(_id));
};

exports.get_select_value = function (_browser, _id) {
  var selected = _browser.query(get_row_class(_id) + ' option:checked');
  return selected && selected.value;
};

var elem_has_class = exports.elem_has_class = function (_elem, _class) {
  return _elem.className.split(' ').indexOf(_class) !== -1;
};

exports.has_class = function (_browser, _id, _class) {
  return elem_has_class(get_row(_browser, _id), _class);
};

exports.assert_result = function (_browser, _expected) {
  var serialized = _browser.text('#serialized');
  if (!serialized) {
    assert.fail('Submission was not valid:' + 
      _browser.query('form').innerHTML);
  }
  assert.deepEqual(_expected, JSON.parse(serialized));
}

exports.assert_error = function (_browser, _id, _error) {
  var row = get_row(_browser, _id);
  assert.ok(
    row, 
    'Element not found: ' + _id
  );
  assert.ok(
    elem_has_class(row, 'error'), 
    'Element without error class: ' + _id
  );
  assert.equal(
    _browser.query(get_row_class(_id) + ' span.error-message').innerHTML, 
    _error
  );
};

exports.assert_attribute = function (_browser, _field, _attribute, _expected) {
  assert.equal(
    _expected, 
    _browser.query(get_row_class(_field) + ' input').getAttribute(_attribute)
  );
};