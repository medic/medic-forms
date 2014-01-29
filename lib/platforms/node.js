
/**
 * @name setup_exports:
 */
var setup_exports = function (_exports) {

  _exports.mmmagic = require('mmmagic');
  return _exports;
};


/**
 * @name is_node:
 *   Return true if we're currently executing under Node.js;
 *   return false if we're currently running somewhere else.
 */
var is_node = function () {

  return (
    (typeof window === 'undefined') &&
      (typeof exports != 'undefined')
  );
};


/**
 * @name main:
 *   Set up platform-specific objects/resources.
 */
var main = function () {

  if (is_node()) {
    setup_exports(exports);
  }
};


/* Entry */
main();

