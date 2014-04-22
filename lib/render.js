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
    renderers = require('./renderers/_compiled'),
    util = require('./util');


/**
 * @name _find_renderer:
 */
var _find_renderer = function (_field) {

  return _.find(renderers.modules, function (_module) {
    return (
      _field.render ? 
        (_field.render === _module.id) : _module.applies_to(_field)
    );
  });
};


/**
 * @name _get_max_length:
 *    Return the max length of the field. Ignores dynamic 
 *    configurations such as scripted length, as this will 
 *    be used as a static field attribute.
 */
var _get_max_length = function (_field) {

  var length = (_field.length && _field.length[1]);

  if (!length || length === Infinity) {
    return undefined;
  }

  return length;
};


/**
 * @name _render_repeat:
 */
var _render_repeat = function (_field, _value, _validation, _options) {

  /* Repeated field */
  var repeat_renderer = _find_renderer({ render: 'repeat' });

  if (!repeat_renderer) {
    return {
      valid: false,
      error: 'No renderer available for field repetition'
    };
  }

  /* Fake validation:
   *  This fake validation result is only used to render the input
   *  template; it won't have any effect on the existing values. */

  var skipped = { skipped: true };

  /* Render input template:
   *  This is what a user will fill in when adding a new
   *  item to a repeating list. This is essentially a prompt
   *  for adding a new item, and not an actual repeated value. */

  var template = _render_field(
    _field.id, _field, undefined, skipped, _options
  );

  if (!template.valid) {
    return template; /* Result object */
  }

  /* Prefix with input template */
  var content = template.result;

  /* Render repeating values:
   *  Render each value of the repeating field, in order. */
  _.each(_value, function (_default, _index) {

    /* Safe: index is always an integer */
    var name = _field.id + '[' + _index + ']';

    var validation = _validation && 
        _validation.detail && 
        _validation.detail[_index];

    var field = _render_field(
      name, _field, _default, validation, _options
    );

    if (!field.valid) {
      return field;
    }

    /* Finished with value */
    content += field.result;
  });

  /* Success */
  return {
    valid: true,
    result: repeat_renderer.render({
      field: _field, validation: _validation, content: content
    })
  };
};


/**
 * @name render_field:
 */
var _render_field = function (_name, _field,
                                 _value, _validation, _options) {

  var options = (_options || {});

  /* FIXME: Use `input.expand_scriptable_properties` */
  if (_field.required && _field.required.javascript) {

    var rv = util.exec(_field.required.javascript, {}, _field);

    if (!rv.success) {
      return { 
        valid: false,
        error: rv.exception
      };
    }

    _field.required = rv.result;
  }

  var renderer = _find_renderer(_field);

  if (!renderer) {
    return { 
      valid: false,
      error: "No renderers could be found for '" + _field.id + "'."
    };
  }

  var validation = _.clone(_validation);

  if (validation && options.initial) {
    validation.error = undefined;
  }

  return {
    valid: true,
    result: renderer.render({
      name: _name,
      field: _field,
      value: _value,
      validation: validation,
      maxlength: _get_max_length(_field)
    })
  };
};


/**
 * @name render_all:
 * @param _fields {Object} An array of field objects
 * @param _values {Object} Optional. The initial values to bind into the 
 *    form, overwriting any field defaults, eg: `{fieldId: initialValue}`
 * @param _validation {Object} Optional. The validation results,
 *    used for rendering validation errors, as returned from the input
 *    validation method.
 * @param _options {Object} Optional. 
 *    initial {boolean} true indicates first load of form so the
 *      renderer doesn't display validation errors.
 */
var _render_all = function (_fields, _values, _validation, _options) {

  var values = (_values || {});
  var validation = (_validation || {});

  /* Render each field */
  var results = _.map(_fields, function (_field) {

    /* FIXME: Use `input.expand_scriptable_properties` */
    var value = (values[_field.id] || _field.default);
    var field_validation = validation.detail && validation.detail[_field.id];

    if (_field.repeat) {

      return _render_repeat(
        _field, value, field_validation, _options
      );
    } else {

      return _render_field(
        _field.id, _field, value, field_validation, _options
      );
    }
  });

  /* Find and concatenate any/all errors:
   *   We should probably show error messages as close as possible
   *   to the input field, as well as highlight the field in error.
   *   We might want to just hand over an error list to the renderer
   *   and allow it to draw the error status however it wants to. */

  var errors = _.compact(_.pluck(results, 'error'));

  if (errors.length && errors[0] != null) {
    return {
      valid: false,
      error: errors.join(' ')
    };
  }

  return {
    valid: true,
    result: _.pluck(results, 'result').join('')
  };
};


/**
 * @name render_form:
 * Renders all the fields wrapped in the form definition
 *
 * @param _form {Object} The form definition
 * @param _values {Object} Optional. The initial values to bind into the 
 *    form, overwriting any field defaults, eg: `{fieldId: initialValue}`
 * @param _validation {Object} Optional. The validation results,
 *    used for rendering validation errors, as returned from the input
 *    validation method.
 * @param _options {Object} Optional. 
 *    initial {boolean} true indicates first load of form so the
 *      renderer doesn't display validation errors.
 */
exports.render_form = function (_form, _values, _validation, _options) {

  var form_renderer = _find_renderer({ render: 'form' });

  if (!form_renderer) {
    return {
      valid: false,
      error: 'No renderers could be found for the form'
    }
  }

  var results = _render_all(
    _form.fields, _values, _validation, _options
  );

  if (!results.valid) {
    return results;
  }

  return {
    valid: true,
    result: form_renderer.render({
      formId: _form.meta.id,
      content: results.result
    })
  }
};


/**
 * @name set_renderers:
 * 
 * Exposed for unit/functional testing only. Do not use.
 */
exports.set_renderers = function (_renderers) {

  renderers = _renderers;
};

