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
    util = require('../../lib/util'),
    deep_equal = require('deep-equal');


/**
 * @name is_recursive_subset:
 *   Return true if the variable `_subset` is a subset of `_superset`.
 *   These arguments are evaluated recursively; the algorithm will
 *   descend in to arrays and ordinary objects until none remain.
 *   Returns true if each property in the tree `_subset` exists in
 *   `_superset` and has an identical value as determined by a
 *   `deep_equal` comparison; false otherwise.
 */
exports.is_recursive_subset = function (_subset, _superset) {

  /* Object case */
  if (util.is_plain_object(_subset)) {
    if (!util.is_plain_object(_superset)) {
      return false;
    }
    for (var k in _subset) {
      if (!exports.is_recursive_subset(_superset[k], _subset[k])) {
        return false;
      }
    }
  /* Array case */
  } else if (_.isArray(_subset)) {
    if (!_.isArray(_superset)) {
      return false;
    }
    for (var i = 0, len = _subset.length; i < len; ++i) {
      if (!exports.is_recursive_subset(_superset[i], _subset[i])) {
        return false;
      }
    }
  /* Other cases */
  } else if (!_.isUndefined(_subset)) {
    return deep_equal(_superset, _subset);
  }

  return true;
};


/**
 * @name compare_partial:
 *   Compare the objects `_lhs` and `_rhs` to each other. If
 *   `_properties` is specified, it will be interpreted as an array
 *   of property names, and the comparison of `_lhs` to `_rhs` will
 *   be limited to those properties. Returns true if `_lhs` and `_rhs`
 *   are equal; false otherwise.
 */
exports.compare_partial = function (_lhs, _rhs, _properties) {

  var properties = (_properties || []);

  if (properties.length == 0) {
    return deep_equal(_lhs, _rhs);
  } else {
    for (var i = 0, len = _properties.length; i < len; ++i) {
      var k = _properties[i];

      if (!deep_equal(_lhs[k], _rhs[k])) {
        return false;
      }
    }
  }

  return true;
};


/**
 * @name make_tests
 *   Creates a list of tests for `nodeunit`, given an `_exports`
 *   object in which to create the tests, a `_name`a `_fixtures` object
 *   containing test fixtures, a `_test_fn` containing the test
 *   code to be executed, and a list of one or more parameters
 *   in `_test_args` to be provided as arguments to `_test_fn`.
 */
exports.make_tests = function (_name, _exports,
                               _fixtures, _test_fn, _test_args) {

  _.each(_fixtures, function (_fixture, _i) {

    var _test_name = _generate_test_name(_name, _fixture, _i);

    if (_fixture.values) {
      _.each(_fixture.values, function (_value, _j) {
        _export(_test_name + _generate_test_name_suffix(_fixture, _j), 
          _fixture, _exports, _test_fn, _test_args, _value);
      });
    } else {
      _export(_test_name, _fixture, _exports, _test_fn, _test_args);
    }
  });
};


/**
 * @name _export:
 *   Insert a test case beneath the `exports` namespace, which
 *   effectively adds the test case to nodeunit's list of tests.
 */
var _export = function (_name, _fixture, _exports,
                        _test_fn, _test_args, _value) {

  if (_exports[_name]) {
    throw Error('Two tests have the same name: ' + _name);
  }

  _exports[_name] = function (_test) {
    _test_fn.apply(
      this, [ _test, _fixture, _value ].concat(_test_args)
    );
  };
};


/**
 * @name _generate_test_name:
 *   Generate a printable description for the test fixture `_fixture`.
 *   Use `_name` as a test category name and `_index` as the ordinal
 *   position of the test fixture.
 */
var _generate_test_name = function (_name, _fixture, _index) {

  return (
    _name + ': ' + (
      _fixture._name ?
        _fixture._name : 'Test fixture #' + (_index + 1)
    )
  );
};


/**
 * @name _generate_test_name_suffix:
 *   Return a suffix (or, if not applicable, the empty string) for
 *   the test name generated by `_generate_test_name`. If the fixture
 *   contains multiple testable entities, the `_ordinal` argument
 *   (optional) should contain the ordinal position of the entity
 *   being tested.
 */
var _generate_test_name_suffix = function (_fixture, _ordinal) {

  if (_fixture.values && _fixture.values.length > 1) {
    return ' at ' + _ordinal;
  }

  return '';
}
