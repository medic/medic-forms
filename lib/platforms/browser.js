
/**
 * @name setup_exports:
 */
var setup_exports = function (_exports) {

  return _exports;
};


/**
 * @name is_node:
 *   Return true if we're currently executing in a browser;
 *   return false if we're currently running somewhere else.
 */
var is_browser = function () {

  return (
    (typeof window !== 'undefined')
  );
};


/**
 * @name main:
 *   Set up platform-specific objects/resources.
 */
var main = function () {

  if (typeof exports === 'undefined') {
    exports = {};
  }

  if (is_browser()) {
    setup_exports();
  }
}


/* Entry */
main();

