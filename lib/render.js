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
    async = require('async'),
    handlebars = require('handlebars');


/**
 * @name _type_map:
 */
var _type_map = {
  _form: {
    template: 'renderers/_form.html'
  },
  string: {
    template: 'renderers/string.html'
  }
};


/**
 * @name _get_template:
 */
var _get_template = function (_parser, _callback) {

  if (_parser.compiledTemplate) {
    _callback(null, _parser.compiledTemplate);
  } else {
    fs.readFile(__dirname + '/' + _parser.template, 'utf8', function(err, template) {
      if (!err) {
        _parser.compiledTemplate = handlebars.compile(template);
      }
      _callback(err, _parser.compiledTemplate);
    });
  }
};


/**
 * @name render_field:
 */
exports.render_field = function (_field, _callback) {

  var parser = _type_map[_field.type];

  if (!parser) {
    _callback('Unknown field type: ' + _field.type);
  }
  _get_template(parser, function(err, _template) {
    if (err) {
      _callback(err);
    } else {
      _callback(null, _template(_field));
    }
  });
};


/**
 * @name render_all:
 */
exports.render_all = function (_form, _callback) {

  async.concatSeries(

    /* Arguments */
    _form.fields, exports.render_field, 

    /* Item handler */
    function(_err, html) {

      if (_err) {
        return _callback(_err);
      }
      _get_template(_type_map._form, function (_e, _template) {

        if (_e) {
          return _callback(_e);
        }
        _callback(null, _template({ content: html }));
      });
    }
  );
};

