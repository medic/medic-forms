
/**
 * This script is executed as one of the npm postinstall hooks.
 * It puts all the test fixtures data into tests/fixtures.js, and
 * then exports the fixtures object.
 */

var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    moment = require('moment'),
    util = require('./include/util');


/**
 * @name main:
 */
var main = function (_argc, _argv) {

  var output_path = "tests/fixtures/compiled.js";

  /* Build file */
  var data = [
    "/* Generated by compile-fixtures.js on "
      + moment().local().format('YYYY-MM-DD [at] hh:mma') + ' */',
    "var fs = require('fs');", '',
    '/* Top-level fixtures object */',
    "exports.all = {};", ''
  ];

  /* Append all test fixtures */
  _read_directory("tests/fixtures", data);

  /* Write output */
  fs.writeFileSync(output_path, data.join("\n"));

  /* Success */
  process.stderr.write(
    "File `" + output_path + "` generated successfully.\n"
  );

  return 0;
};


/**
 * conver the path to objects
 * tests/fixtures/forms --> tests.fixtures.forms = {};
 * tests/fixtures/forms/invalid.json --> tests.fixtures.forms.invalid
 * @param  {[type]} path [description]
 * @return {[type]}      [description]
 */
function _object_name_from_path(_path, _base_path) {

  /* Strip base path */
  if (_path.indexOf(_base_path) === 0) {
    _path = _path.substring(_base_path.length, _path.length);
  }

  /* Convert path to object notation */
  var name = _path.split("/").join(".").replace(/\.json$/, '');

  return name.replace(/[^A-Za-z0-9\_\.]/g, "_");
}



/**
 * @name _get_line_data:
 */
function _get_line_data (_fpath, _is_file, _base_path) {

  var dot_path = _object_name_from_path(_fpath, _base_path);

  if (_is_file) {
    return (
      "/* File: " + _fpath + " */ \n" +
        'exports' + dot_path + " = JSON.parse('" +
          util.escape_json_string(fs.readFileSync(_fpath)) + "');\n"
    );
  } else {
    return (
      "/* Directory: " + _fpath + " */ \n" +
        'exports' + dot_path + " = {};\n"
    );
  }
}


/**
 * @name _read_directory:
 */
function _read_directory (_path, _data, _base_path) {

  var files = fs.readdirSync(_path);
  var base_path = (_base_path || _path);

  _.each(files, function (_element, _index) {

    var fpath = path.join(_path, _element);
    var fstats = fs.statSync(fpath);

    /* Skip dot-prefixed files/directories */
    if (_element.match(/^\./)) {
      return;
    }
    
    /* Process files */
    if (fstats.isDirectory()) {

      /* Emit directory object */
      _data.push(_get_line_data(fpath, false, base_path));

      /* Recur in to directory */
      _read_directory(fpath, _data, base_path);

    } else if (fstats.isFile()) {

      /* Only process .json files */
      if (_element.match(/\.json$/)) {
        _data.push(_get_line_data(fpath, true, base_path));
      }
    }
  });
}


/* Entry point:
 *   Start `main` and exit with the returned status. */

process.exit(
  main(process.argv.length, process.argv)
);

