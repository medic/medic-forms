
/**
 * @name escape_json_string:
 *   Escape the JSON-containing string `_string` in a way that
 *   allows it to be contained within a single-quoted string.
 *   Reduce whitespace wherever possible.
 */
exports.escape_json_string = function (_string) {

  return (
    _string.toString().replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'").replace(/[\n\t\s]+/g, ' ')
  );
};

