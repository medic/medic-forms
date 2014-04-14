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

var _ = require('underscore');


/* @name _regex:
 *   Shared and/or multi-purpose regular expressions, used
 *   inside of the input validation code. These are compiled
 *   once on module initialization, and are then ready to run. */

var _regex = {
  date: /^\d{4}-\d{2}-\d{2}$/,
  timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
  float: /^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/,
  integer: /^(\-|\+)?([0-9]+|Infinity)$/
}


/**
 * @name is_omitted_value:
 *   Return true if a value has been omitted from a specific JSON
 *   form property. Omitted values are typically either boolean,
 *   null, or undefined, and should be substituted with a suitable
 *   default value.  If `_allow_boolean` is true-like, then boolean
 *   values are *not* considered to be omitted values; use this in
 *   scenarios where a boolean value is (or can be) the data itself
 *   (rather than an indicator of its omission).
 */
exports.is_omitted_value = function (_value, _allow_boolean) {

  return (
    _.isUndefined(_value) || _.isNull(_value)
      || (!_allow_boolean && _.isBoolean(_value))
  );
};


/**
 * @name any_omitted_values:
 *   Apply `is_omitted_value` to each item in `_values`; return
 *   true immediately if any value in `_values` is omitted.
 *   Otherwise, return false. The `_allow_boolean` parameter is
 *   passed on to `is_omitted_value` as-is.
 */
exports.any_omitted_values = function (_values, _allow_boolean) {

  for (var i = 0, len = _values.length; i < len; ++i) {
    if (exports.is_omitted_value(_values[i], _allow_boolean)) {
      return true;
    }
  }

  return false;
};


/**
 * @name pad:
 *   Pad the array `_array` out to a length of `_n`, provided
 *   it is not already of an equal or greater length, using
 *   the value provided in `_default_value`.
 */
exports.pad = function (_array, _n, _default_value) {

  var n = (_n - _array.length);

  if (n <= 0) {
    return _array;
  }

  var pad = [];

  for (var i = 0; i < n; ++i) {
    pad.push(_default_value);
  }

  return _array.concat(pad);
};


/**
 * @name _parse_number:
 *   Parse the given string into a Number or return the original input
 */
var _parse_number = function (_input, _decimal) {
  var regex = _decimal ? _regex.float : _regex.integer;
  if (_.isString(_input) && regex.test(_input.trim())) {
    return Number(_input);
  }
  return _input;
};

/**
 * @name parse_integer:
 *   Parse the given string into a Number or return the original input
 */
exports.parse_integer = function (_input) {
  return _parse_number(_input, false);
};

/**
 * @name parse_float:
 *   Parse the given string into a Number or return the original input
 */
exports.parse_float = function (_input) {
  return _parse_number(_input, true);
};


/**
 * @name is_integer:
 *   Return true if `_value` is numeric and contains no decimal
 *   portion; otherwise return false.
 */
exports.is_integer = function (_value) {

  return (
    _.isNumber(_value) &&
      (Math.floor(_value) === _value)
  );
};


/**
 * @name is_plain_object:
 *   Return true if the object `_object` is an ordinary
 *   anonymous object; false otherwise.
 */
exports.is_plain_object = function (_object) {

  return (
    _.isObject(_object) && !_.isArray(_object) &&
      !_.isElement(_object) && !_.isDate(_object) &&
        !_.isRegExp(_object) && !_.isArguments(_object)
  );
};


/**
 * @name is_date:
 *   Return true if the string `_value` is an valid date in the
 *   format: YYYY-MM-DD
 */
exports.is_date = function (_value) {
  return _regex.date.test(_value) && Date.parse(_value);
};


/**
 * @name is_date:
 *   Return true if the string `_value` is an valid date in the
 *   format: YYYY-MM-DDTHH:mm:SS.sssZ
 */
exports.is_timestamp = function (_value) {
  return _regex.timestamp.test(_value) && Date.parse(_value);
};


/**
 * @name exec:
 *   Execute the javascript code in `_code` as a function body,
 *   providing the argument name/value mapping object `_arguments` to
 *   it as an argument list.  Returns an object containing information
 *   on the outcome of execution: the `success` property is true if
 *   the function was successfully executed or false otherwise; the
 *   `result` property contains the value returned by the function if
 *   and only if the `success` property is true; the `execption`
 *   property contains the exception thrown by the function (or the
 *   runtime) if the `success` property is false. If the `_this`
 *   argument is specified, it will be used as the value for `this`
 *   when invoking the anonymous function that contains `_code`.
 */
exports.exec = function (_code, _arguments, _this) {

  var rv = { success: false };
  var args = exports.separate_object(_arguments);

  try {

    var fn = Function.constructor.apply(
      null, args.keys.concat([ _code ])
    );

    rv.result = fn.apply(_this, args.values);
    rv.success = true;

  } catch (_e) {

    rv.exception = _e;
  }

  return rv;
};


/**
 * @name separate_object:
 *   Split the object `_object` in to an array of keys and a
 *   corresponding array of values. The return value is an object with
 *   a `keys` property and a `values` property; the `keys` property is
 *   an array of property names, and the `values` property is an array
 *   of values. If the return value is `rv`, then `rv.values[i]` is
 *   the value of the property named `rv.keys[i]` for all `i` less
 *   than `rv.length`.  Use this function when you need to create
 *   separate arrays of keys and values for a particular object, and
 *   need to ensure that the order of each matches the key/value
 *   relationship of the original object.
 */
exports.separate_object = function (_object) {

  var rv = { keys: [], values: [] };

  _.each(_object, function (_value, _key) {

    rv.keys.push(_key);
    rv.values.push(_value);
  });

  return rv;
};


/*
 * @name all_properties_equal:
 *   Return true if all objects contained in `_objects` have
 *   the property `_property`, and that property is exactly
 *   equal to `_value` in every case. Otherwise, return false.
 */
exports.all_properties_equal = function (_objects, _property, _value) {

  for (var i = 0, len = _objects.length; i < len; ++i) {

    if (_objects[i][_property] !== _value) {
      return false;
    }
  }

  return true;
};


/**
 * @name async_error_check:
 *   If `_rv` has a true-like `valid` property, call `_next_fn` with
 *   its first argument set to null. Otherwise, call `_next_fn` with
 *   its first argument set to `_rv`. The `_this` argument will be
 *   used as the calling context, and the `_args` array will be
 *   appended to the call's argument list if it is provided. As a
 *   shortcut, you can pass a boolean `true` for `_args` if you'd
 *   like; doing this will automatically include `_rv` as a single
 *   argument. This function should be used inside of an `async`
 *   step function (e.g. `async.waterfall`) if you need to proceed
 *   on condition of a result being valid.
 */
exports.async_error_check = function (_this, _rv, _next_fn, _args) {

  var args = (_args || []);

  if (args === true) {
    args = [ _rv ];
  }

  return _next_fn.apply(
    _this, [ (_rv.valid ? null : _rv) ].concat(args)
  );
};


/**
 * @name async_final:
 *   A helper function for use in the completion functions of
 *   `async` methods such as `async.waterfall`. This ombines a
 *   node-style error object and a result object in to a single
 *   result object, and then invokes `_fn` with the result object
 *   provided as an argument. If `_rv` is exactly equal to `false`
 *   and `_err` is false-like, a `null` is passed to `_fn` instead
 *   of a result object. You can think of this function as the
 *   reversal of `async_error_check`: `async_error_check` translates
 *   result object semantics to async/node error semantics, and
 *   `async_final` translates the latter back to a result object.
 */
exports.async_final = function (_this, _fn, _err, _rv) {

  if (_err) {
    return _fn.call(_this, _err);
  }

  if (!_rv && _rv !== false) {
    _rv = { valid: true };
  }

  return _fn.call(_this, _rv);
};


/**
 * @name is_script_directive:
 *   Return true if `_value` is an object containing a single
 *   script fragment; false otherwise. These "scripted properties"
 *   must be evaluated in order to determine the intended literal
 *   value for the field property. This function is used in all three
 *   phases of the form-loading pipeline (form validation, form
 *   normalization, and input validation); the script fragments
 *   pass through the first two phases unmodified, and are evaluated
 *   during the input validation phase.
 */

exports.is_script_directive = function (_value) {

  /* Type checks */
  if (!exports.is_plain_object(_value) || !_.isString(_value.javascript)) {
    return false;
  }

  /* No other properties allowed */
  if (_.keys(_value).length !== 1) {
    return false;
  }

  /* Success */
  return true;
};


/* vim: set ai ts=8 sts=2 sw=2 expandtab: */
