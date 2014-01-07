
var _ = require('underscore');

/**
 * @name is_omitted_value:
 *   Return true if a value has been omitted from a specific
 *   JSON form property. Omitted values are either boolean,
 *   null, or undefined, and should be substituted with a
 *   suitable default value.
 */
exports.is_omitted_value = function (_value) {
  
  return (
    _.isBoolean(_value) ||
      _.isNull(_value) || _.isUndefined(_value)
  );
};

