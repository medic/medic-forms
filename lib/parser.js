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
    qs = require('querystring'),
    util = require('./util'),
    repeatingRegex = /(.+)\[([0-9]+)\]$/;

var _parsers = {
  httppost: function (_input, _getFormFn) {
    var parsed = qs.parse(_input);
    var form = _getFormFn(parsed.$form);
    if (!form.valid) {
      return form;
    }
    var cleaned = {};
    _.each(_.keys(parsed), function(key) {
      var value = parsed[key];
      if (value) {
        var repeating = repeatingRegex.exec(key);
        if (repeating) {
          key = repeating[1];
          var index = repeating[2];
          if (!cleaned[key]) {
            cleaned[key] = [];
          }
          cleaned[key][index] = value;
        } else {
          cleaned[key] = value;
        }
      }
    });
    _.each(_.keys(cleaned), function(key) {
      if (_.isArray(cleaned[key])) {
        cleaned[key] = _.compact(cleaned[key]);
      }
    });
    return {
      valid: true,
      result: cleaned
    }
  }
};

exports.parse = function (_forms, _input, _parser_id) {
  var parser = _parsers[_parser_id];
  if (!parser) {
    return {
      valid: false,
      error: 'Unknown parser ' + _parser_id
    }
  }
  var getFormFn = _.partial(util.get_form, _forms);
  return parser.call(this, _input, getFormFn);
};