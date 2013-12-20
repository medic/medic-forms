
var _ = require('underscore');

/**
 * @name rewrite:
 */
exports.rewrite = function (_object) {

  return _rewrite_references(_object, false, false, _object);
};

/**
 * @name rewrite_each:
 */
exports.rewrite_each = function (_objects) {

  _.each(_objects, function (_object, _i) {
    _objects[_i] = exports.rewrite(_object);
  });

  return _objects;
};

/**
 * @name _rewrite_references:
 */
var _rewrite_references = function (_root, _parent, _key, _subtree) {

  var keys = Object.keys;

  if (_.isArray(_subtree)) {

    _.each(_subtree, function (_subitem, _i) {
      _rewrite_references(_root, _subtree, _i, _subitem);
    });

  } else if (_.isObject(_subtree)) {

    if (keys(_subtree).length == 1 && (_subtree.$ref || '').length > 0) {
      replace_reference(_root, _parent, _key, _subtree.$ref);
    } else {
      _.each(_subtree, function (_v, _k) {
        _rewrite_references(_root, _subtree, _k, _subtree[_k]);
      });
    }
  }

  return _root;
};

/**
 * @name replace_reference:
 */
var replace_reference = function (_root, _parent, _key, _reference) {

  var rv = lookup_reference(_root, _parent, _reference);

  if (!_.isUndefined(rv)) {
    _parent[_key] = rv;
  }
};

/**
 * @name lookup_reference:
 */
var lookup_reference = function (_root, _parent, _reference) {

  var context = false;
  var fragment = (_reference || '').match(/^[^#]*#(.+)$/);

  if (!fragment) {
    return false;
  }

  var path = fragment[1].split('/');

  for (var i = 0; i < path.length; ++i) {

    var key = path[i];

    /* First run:
        Set `context` based upon presence of leading slash. */

    if (i == 0) {
      if (key === '') {
        /* Absolute path */
        context = _root;
        continue;
      } else {
        /* Relative path */
        context = _parent;
      }
    }

    /* Check for termination */
    if (!_.isArray(context) && !_.isObject(context)) {
      return false;
    }

    /* Descend one level */
    context = context[key];

    if (_.isUndefined(context)) {
      return false;
    }
  }

  return context;
};

