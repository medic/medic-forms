
var _ = require('underscore'),
    http = require('http'),
    async = require('async'),
    fs = require('fs'),
    jsdump = require('jsDump'),
    handlebars = require('handlebars'),
    api = require('../../lib/api').create(),
    server, formDefinition,
    templates = {};


/**
 * @name _serialize:
 */
var _serialize = function (parsed, callback) {

  api.load([ formDefinition ], function (_result) {

    if (!_result.valid) {
      return callback(_result);
    }

    api.fill(parsed, function (_result) {
      callback(_result);
    });
  });
};


/**
 * @name _sendOk:
 */
var _sendOk = function (res, content) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(content);
};


/**
 * @name _sendError:
 */
var _sendError = function (res, error) {

  console.log(error);
  res.writeHead(500, {'Content-Type': 'text/html'});
};


/**
 * @name _sendForm:
 */
var _sendForm = function (res, parsed, valid, options) {

  var form = api.render(
    'TEST', parsed, valid, options
  );

  if (form.valid || options.initial) {
    _sendOk(res, templates.render({ form: form.result }));
  } else {
    _sendError(res, form.error);
  }
};


/**
 * @name _startServer:
 */
var _startServer = function (callback) {

  server = http.createServer(function (req, res) {

    var body = '';

    req.on('data', function (data) {
      body += data;
    });

    req.on('end', function () {

      var urlParts = req.url.split('?');

      if (urlParts[0] === '/') {
        if (req.method === 'GET') {
          
          formDefinition = JSON.parse(unescape(
            urlParts[1].split('=')[1]
          ));

          _serialize({$form: 'TEST'}, function (valid) {
            _sendForm(res, {}, valid, { initial: true });
          });

        } else {

          var parsed = api.parse(body, 'httppost');

          if (!parsed.valid) {
            _sendError(res, parsed.error);
          } else {
            _serialize(parsed.result, function (serialized) {
              if (serialized.valid) {
                delete parsed.result.$form;
                _sendOk(res, templates.result({
                  result: JSON.stringify(parsed.result)
                }));
              } else {
                _sendForm(res, parsed.result, serialized);
              }
            });
          }
        }

      } else if (urlParts[0] === '/scripts/behavior.js') {
        fs.readFile('../../lib/renderers/_behavior.js', 'utf8', function (err, data) {
          res.writeHead(200, {'Content-Type': 'application/javascript'});
          res.end(data);
        });
      }
    });
  });

  server.listen(7357, 'localhost', function () {
    console.log('Server running at http://localhost:7357/');
    callback();
  });
};


/**
 * @name stop:
 */
exports.stop = function () {

  console.log('Server shutting down');
  server.close();
};


/**
 * @name start:
 */
exports.start = function (callback) {

  if (server) {
    return callback('Stop the server before starting a new one');
  }

  async.map(

    [ 
      { name: 'render', file: 'template.html', compile: true },
      { name: 'result', file: 'template-results.html', compile: true },
      { name: 'behavior', file: '../../lib/renderers/_behavior.js' } 
    ],

    /* Iterator function */
    function (_template, _callback) {

      fs.readFile(_template.file, 'utf8', function (err, data) {

        if (!err) {
          if (_template.compile) {
            data = handlebars.compile(data);
          }
          templates[_template.name] = data;
        }
        
        _callback(err);

      });
    }, 

    /* Completion function */
    function (_err) {

      if (_err) {
        return callback(_err);
      }

      _startServer(callback);
    }
  );
};
