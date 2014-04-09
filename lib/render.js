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

var _ = require('underscore'),
    handlebars = require('handlebars'),
    renderers = require('./renderers/_compiled');

handlebars.registerHelper('row', function(field, validation, options) {
  var classname = validation && validation.error ? ' class="error"' : '';
  return  '<li id="row-' + field.id + '"' + classname + '>' + 
            options.fn(this) + 
          '</li>';
});
handlebars.registerPartial('errorMessage', '{{#if validation.error}}<span class="error-message">{{validation.error}}</span>{{/if}}');
handlebars.registerPartial('label', '<label for="field-{{field.id}}">{{field.name}}</label>');

var _find_renderer = function(_field) {
  return _.find(renderers.modules, function(module) {
    return _field.render ? 
      _field.render === module.id : 
      module.applies_to(_field);
  });
}

/**
 * @name render_field:
 */
exports.render_field = function (_field, _value, _validation) {
  var renderer = _find_renderer(_field);
  if (!renderer) {
    return { 
      valid: false,
      field: _field
    };
  }
  return {
    valid: true,
    result: renderer.render(_field, _value, _validation)
  };
};


/**
 * @name render_all:
 * @param _fields {Object} An array of field objects
 * @param _values {Object} Optional: The initial values to bind into the 
 *    form, overwriting any field defaults, eg: `{fieldId: initialValue}`
 * @param _validation {Object} Optional: The validation results,
 *    used for rendering validation errors, as returned from the input
 *    validation method.
 */
exports.render_all = function (_fields, _values, _validation) {
  _values = _values || {};
  _validation = _validation || {};
  var results = _.map(_fields, function(field) {
    return exports.render_field(
      field, 
      _values[field.id], 
      _validation.detail && _validation.detail[field.id]
    );
  });
  var errorFields = [];
  _.each(results, function(result) {
    if (!result.valid) {
      errorFields.push(result.field.id);
    }
  });
  if (errorFields.length) {
    return {
      valid: false,
      error: 'No renderers could be found for: ' + errorFields.join(', ')
    };
  }
  return {
    valid: true,
    result: _.pluck(results, 'result').join('')
  }
};

/**
 * @name render_form:
 * Renders all the fields wrapped in the form definition
 *
 * @param _form {Object} The form definition
 * @param _values {Object} Optional: The initial values to bind into the 
 *    form, overwriting any field defaults, eg: `{fieldId: initialValue}`
 * @param _validation {Object} Optional: The validation results,
 *    used for rendering validation errors, as returned from the input
 *    validation method.
 */
exports.render_form = function (_form, _values, _validation) {
  var formRenderer = _find_renderer(_form);
  if (!formRenderer) {
    return {
      valid: false,
      error: 'No renderers could be found for the form'
    }
  }
  var results = exports.render_all(_form.fields, _values, _validation);
  if (!results.valid) {
    return results;
  }
  return {
    valid: true,
    result: formRenderer.render(results.result)
  }
}

/**
 * @name set_renderers:
 * 
 * Exposed for testing only
 */
exports.set_renderers = function (_renderers) {
  renderers = _renderers;
};