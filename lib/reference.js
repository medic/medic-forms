
'use strict';

var util = require('./util'),
    clone = require('clone'),
    _ = require('underscore');


/**
 * @name rewrite:
 *   Perform rewriting of `$ref`-style JSON references for the
 *   object provided in `_object`. If `_reference_root` is not
 *   false-like, references are resolved using it as a root node;
 *   otherwise, `_object` is used as the root. The `_object` is
 *   modified in-place; if you need to preserve the original value,
 *   you'll need to deep-clone the object before calling `rewrite`.
 */
exports.rewrite = function (_object, _reference_root) {

  return _rewrite_references(
    _object, (_reference_root || _object)
  );
};


/**
 * @name rewrite_each:
 *   Call `rewrite` for every object in `_objects`, using each
 *   individual object as its own root node for reference resolution.
 *   If you're attempting to rewrite references for every item in a
 *   list, and those items are unrelated, use this function.
 */
exports.rewrite_each = function (_objects) {

  var rv = [];

  /* Rewrite every object */
  for (var i = 0, len = _objects.length; i < len; ++i) {
    rv[i] = exports.rewrite(_objects[i]);
  }

  /* Determine if every rewrite was successful */
  var valid = util.all_properties_equal(rv, 'valid', true);

  /* Finished */
  return { valid: valid, detail: rv };
};


/**
 * @name _merge_override_properties:
 *   Replace values in the enumerable object `_to` with values from
 *   the enumerable object `_from`, using a "deep-extend" algorithm.
 *   If any pair of items has both a key/index and type in common,
 *   and that type is a plain object or array, recursively merge the
 *   item in `_from` into the item in `_to`. This allows for overriding
 *   of deeply-nested properties without replacing a whole object.
 *   As an example: merging the "from" object `{ a: { b: { d: 2, e: 4 } } }`
 *   in to the "to object `{ a: { b: { c: 0, d: 1 } } }` will transform
 *   the "to" object in to `{ a: { b: { c: 0, d: 2, e: 4 } } }`. This
 *   function modifies `_to` in-place, and no value is returned.
 */
var _merge_override_properties = function (_to, _from, _parent, _key) {

  var is_object = util.is_plain_object;
  var is_first_run = util.any_omitted_values([ _parent, _key ], true);

  var should_merge = (
    (is_object(_to) || _.isArray(_to))
      && (is_object(_from) || _.isArray(_from))
  );

  if (should_merge) {
    return _.each(_from, function (_object, _k) {
      if (_k != '$ref') {
        _merge_override_properties(_to[_k], _from[_k], _to, _k);
      }
    });
  }
 
  if (!is_first_run && !util.is_omitted_value(_from, true)) {
    _parent[_key] = _from;
  }
};


/**
 * @name _rewrite_references:
 *   The internal recursive reference-rewriting implementation.
 *   Within `_subtree`, locate any `$ref`-style reference objects,
 *   and then replace each of them with the appropriate value
 *   from beneath `_reference_root`. The `parent` and `_key`
 *   arguments are used only in the recursive cases and may be
 *   omitted on first invocation. The `_parent` argument refers
 *   to the object that contains `_subtree`, and `_key` refers to
 *   the position within `_parent` that is currently occupied by
 *   `_subtree`.
 */
var _rewrite_references = function (_subtree,
                                    _reference_root, _parent, _key) {

  var keys = Object.keys;

  if (_.isArray(_subtree)) {

    for (var i = 0, len = _subtree.length; i < len; ++i) {

      var rv = _rewrite_references(
        _subtree[i], _reference_root, _subtree, i
      );

      if (!rv.valid) {
        return rv;
      }
    }

  } else if (util.is_plain_object(_subtree)) {

    /* First run?
     *   We can't replace reference directives that occur at the
     *   top level, because we have no way of finding the object that
     *   contains the top-level, if one even exists. Leave these as-is. */

    var is_first_run = util.any_omitted_values([ _parent, _key ], true);

    /* Rewrite reference:
     *   We currently *don't* recur in to subtrees we've just replaced,
     *   as it'd cause an infinite recursive loop if there were a chain
     *   of `$ref` properties that formed a loop. Recursive evaluation
     *   of replaced subtrees will eventually be useful, but we'll need
     *   to add cycle detection logic before we can safely enable it. */

    if (!is_first_run && (_subtree.$ref || '').length > 0) {

      var rv = _replace_reference(
        _subtree.$ref, _reference_root, _parent, _key
      );

      if (!rv.valid) {
        return rv;
      }

      /* Merge remaining properties:
       *   This allows a `$ref` directive to override selected properties
       *   (but not necessarily all properties) in a replacement object or
       *   array, even if those properties are deeply nested or subsets. */

      _merge_override_properties(rv.result, _subtree);

    } else {

      /* Recursive case:
       *   Recur on anything; scalar values will be ignored. */

      for (var k in _subtree) {

        var rv = _rewrite_references(
          _subtree[k], _reference_root, _subtree, k
        );

        if (!rv.valid) {
          return rv;
        }
      }
    }
  }

  return { valid: true };
};


/**
 * @name _replace_reference:
 *   Resolve the JSON path `_reference_string` starting at the object
 *   or array in `_reference_root`, and write the discovered value to
 *   `_parent[_key]`.
 */
var _replace_reference = function (_reference_string,
                                   _reference_root, _parent, _key) {

  var rv = _lookup_reference(
    _reference_string, _reference_root, _parent
  );

  if (!rv.valid) {
    return rv;
  }

  /* Separate from `_reference_root` */
  _parent[_key] = clone(rv.result);

  /* Success */
  return { valid: true, result: _parent[_key] };
};


/**
 * @name _lookup_reference:
 *   Parse the JSON path reference provided in `_reference_string`.
 *   If the path is an absolute reference, start the resolution
 *   process at the object or array in `_reference_root`. If the
 *   path is a relative reference, start the resolution process at
 *   the object or array in `_parent`. Return a result object,
 *   containing a boolean `valid` property, a `result` property if
 *   `valid` is true, and additional error information beneath the
 *   `error` and `detail` properties if `valid` is false.
 */
var _lookup_reference = function (_reference_string,
                                  _reference_root, _parent) {

  var rv = false;

  /* Extract path portion from JSON reference */
  var fragment = (_reference_string || '').match(/^[^#]*#(.+)$/);

  if (!fragment) {
    return {
      valid: false,
      detail: { ref: _reference_string },
      error: 'Invalid path provided for `$ref` directive'
    };
  }

  /* Separate components */
  var path = fragment[1].split('/');

  if (path.length <= 0) {
    return false;    return {
      valid: false,
      detail: { ref: _reference_string, path: path },
      error: 'Empty path provided for `$ref` directive'
    };
  }

  /* Resolve path components in order */
  for (var i = 0; i < path.length; ++i) {

    var key = path[i];

    /* First run only:
        Set `rv` based upon presence of leading slash. */

    if (i == 0) {
      if (path[0] === '') {
        /* Absolute path */
        rv = _reference_root;
        continue;
      } else {
        /* Relative path */
        rv = _parent;
      }

      /* Require valid root element */
      if (!_.isArray(rv) && !util.is_plain_object(rv)) {
        return {
          valid: false,
          detail: { ref: _reference_string, path: path },
          error: 'Invalid context for resolution of `$ref` directive'
        };
      }
    }

    /* Descend one level */
    rv = rv[key];

    /* Require defined value */
    if (_.isUndefined(rv)) {
      return {
        valid: false,
        detail: { component: path[i], ref: _reference_string, path: path },
        error: 'Path component not found while processing `$ref` directive'
      };
    }
  }

  return { valid: true, result: rv }
};

