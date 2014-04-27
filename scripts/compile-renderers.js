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
    path = require('path'),
    _ = require('underscore'),
    async = require('async'),
    moment = require('moment'),
    less = require('less'),
    browserify = require('browserify'),
    util = require('./include/util'),
    base_path = 'lib/renderers';


/**
 * @name main:
 *    Updates the JavaScript and CSS for rendering and interacting
 *    with forms.
 */
var main = function () {

  var renderers = [];
  _get_renderers(base_path, renderers);

  async.waterfall([
    function(cb) { 
      _update_compiled (renderers, cb);
    },
    function(cb) { 
      _update_behavior (renderers, cb);
    },
    function(cb) { 
      _update_uat (cb);
    },
    function(cb) { 
      _update_style (renderers, cb);
    }
  ], function(err) {
    if (err) {
      console.log(err);
    }
    process.exit(err ? 1 : 0);
  });

};


/**
 * @name _update_compiled:
 *    Creates the JavaScript for rendering the forms
 */
function _update_compiled (_renderers, _cb) {

  var data = [];
  var output_path = path.join(base_path, '_compiled.js');

  /* Render content */
  _write_header(data);
  _write_helpers(data);
  _write_partials(data);
  _write_modules(data, _renderers);

  /* Write file */
  fs.writeFile(output_path, data.join('\n'), function(err) {
    if (!err) {
      /* Indicate success */
      process.stdout.write(
        'File `' + output_path + '` generated successfully.\n'
      );
    }
    _cb(err);
  });

}


/**
 * @name _update_behavior:
 *    Creates the JavaScript for interacting with rendered forms
 */
function _update_behavior (_renderers, _cb) {

  var b = browserify();

  _.each(_renderers, function (renderer) {

    if (renderer.behavior) {
      b.add(renderer.behavior);
    }
  });

  b.bundle(function (err, behaviors) {

    if (err) {
      return _cb(err);
    }
    _write_behavior(behaviors, _cb);
  });
}


/**
 * @name _update_uat:
 *    Creates the JavaScript for the UAT server
 */
function _update_uat (_cb) {

  var b = browserify();

  b.ignore('.' + path.sep + path.join('lib', 'platforms', 'node.js'));
  b.add('.' + path.sep + path.join('tests', 'functional', 'uat'));


  b.bundle(function (err, behaviors) {

    if (err) {
      return _cb(err);
    }
    _write_uat(behaviors, _cb);
  });
}


/**
 * @name _update_style:
 *    Compiles the CSS used for rendering forms
 */
function _update_style (_renderers, _cb) {

  var output_path = path.join(base_path, '_style.css');

  var imports = _.map(
    _.filter(_renderers, function (renderer) {
      return renderer.style;
    }), function (renderer) {
      return '@import "' + renderer.style + '";';
    }
  );

  imports.unshift(
    '@import "' + path.join(base_path, 'standard.less') + '";'
  );

  less.render(imports.join('\n'), function (err, css) {
    if (err) {
      _cb(err);
    } else {
      var data = [];
      _write_header(data);
      data.push(css);
      fs.writeFile(output_path, data.join('\n'), function(err) {
        if (!err) {
          /* Indicate success */
          process.stdout.write(
            'File `' + output_path + '` generated successfully.\n'
          );
        }
        _cb(err);
      });
    }
  });

}

/**
 * @name _write_behavior:
 */
function _write_behavior (_behaviors, _cb) {

  var data = [];
  var output_path = path.join(base_path, '_behavior.js');

  _write_header(data);
  _write_includes(data);

  fs.writeFile(output_path, data.join('\n'), function(err) {
    if (err) {
      _cb(err);
    } else {
      fs.appendFile(output_path, _behaviors, function (err) {

        if (!err) {
          process.stdout.write(
            'File `' + output_path + '` generated successfully.\n'
          );
        }

        _cb(err);
      });
    }
  });

}



/**
 * @name _write_uat:
 */
function _write_uat (_behaviors, _cb) {

  var data = [];
  var output_path = path.join('tests', 'functional', '_uat.js');

  _write_header(data);

  fs.writeFile(output_path, data.join('\n'), function(err) {
    if (err) {
      _cb(err);
    } else {
      fs.appendFile(output_path, _behaviors, function (err) {

        if (!err) {
          process.stdout.write(
            'File `' + output_path + '` generated successfully.\n'
          );
        }

        _cb(err);
      });
    }
  });

}


/**
 * @name _write_includes:
 */
function _write_includes (_data) {

  _data.push(
    fs.readFileSync(
      path.join(base_path, 'jquery-1.8.3.min.js')
    )
  );
}


/**
 * @name _write_header:
 */
function _write_header (_data) {

  _data.push(
    '/* Generated by compile-renderers.js on '
      + moment().local().format('YYYY-MM-DD [at] hh:mma') + ' */\n'
  );
}


/**
 * @name _write_helpers:
 */
function _write_helpers (_data) {

  var dir = path.join(base_path, 'helpers');
  var files = fs.readdirSync(dir);

  _data.push("var handlebars = require('handlebars');\n");
  _data.push('/* Extensions */');

  _.each(files, function (_element) {

    if (_element.match(/.*\.js/)) {
      _data.push("require('./helpers/" + _element + "');");
    }
  });

  _data.push('');
}


/**
 * @name _write_partials:
 */
function _write_partials (_data) {

  var dir = path.join(base_path, 'partials');
  var files = fs.readdirSync(dir);

  _data.push('/* Handlebars partials */');

  _.each(files, function (_element) {

    if (_element.match(/.*\.html/)) {

      var name = _element.split('.')[0];
      var contents = _read_and_escape(path.join(dir, _element));

      _data.push(
        "handlebars.registerPartial('" +
          name + "', '" + contents + "');"
      );
    }
  });

  _data.push('');
}


/**
 * @name _write_modules:
 */
function _write_modules (_data, _renderers) {

  var modules = [];

  /* Append all renderers */
  var required = _.map(
    _renderers, function (renderer) {
      return (
        "  require('" + renderer.module +
          "').init(" + JSON.stringify(renderer.attachments) + ')'
      )
    }
  );

  _data.push('/* Render modules */');
  _data.push('exports.modules = [');
  _data.push(required.join(',\n'));
  _data.push('];');
}


/**
 * @name _get_renderers:
 */
function _get_renderers (_path, _renderers) {

  var files = fs.readdirSync(_path);

  _.each(files, function (_element) {
    
    /* Skip dot-prefixed files/directories */
    if (_element.match(/^\./)) {
      return;
    }

    var fpath = path.join(_path, _element);
    var fstats = fs.statSync(fpath);
    
    if (fstats.isDirectory()) {
      if (fs.existsSync(path.join(fpath, 'renderer.json'))) {
        _renderers.push(_create_module(fpath));
      } else {
        _read_directory(fpath, _renderers);
      }
    }
  });
}


/**
 * @name _read_directory:
 */
function _read_directory (_path, _modules) {

  var files = fs.readdirSync(_path);

  _.each(files, function (_element) {
    
    /* Skip dot-prefixed files/directories */
    if (_element.match(/^\./)) {
      return;
    }

    var fpath = path.join(_path, _element);
    var fstats = fs.statSync(fpath);
    
    if (fstats.isDirectory()) {
      if (fs.existsSync(path.join(fpath, 'renderer.json'))) {
        _modules.push(_create_module(fpath));
      } else {
        _read_directory(fpath, _modules);
      }
    }
  });
}


/**
 * @name _create_module:
 */
function _create_module (_fpath) {

  var renderer = JSON.parse(
    fs.readFileSync(path.join(_fpath, 'renderer.json'))
  );

  var result = {
    module: path.join('..', '..', _fpath, renderer.module)
  };

  /* Client-side behaviors */
  if (renderer.behavior) {
    result.behavior = (
      '.' + path.sep + path.join(_fpath, renderer.behavior)
    );
  }

  /* Client-side styles */
  if (renderer.style) {
    result.style = (
      '.' + path.sep + path.join(_fpath, renderer.style)
    );
  }

  /* Attachments */
  if (renderer.attachments) {
    result.attachments = {};
    _.each(_.pairs(renderer.attachments), function (entry) {

      result.attachments[entry[0]] =
        _read_and_escape(path.join(_fpath, entry[1]));
    });
  }

  return result;
}


/**
 * @name _read_and_escape:
 */
function _read_and_escape (_path) {

  return util.escape_json_string(fs.readFileSync(_path));
}


/* Entry point:
 *   Start `main` and exit with the returned status. */

main();

