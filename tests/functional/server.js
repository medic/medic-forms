
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

    var submission = _.extend({$form: 'TEST'}, parsed); 

    api.fill(submission, function (_result) {
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

      if (req.method === 'GET') {

        formDefinition = JSON.parse(
          unescape(req.url.split('=')[1])
        );

        _serialize({}, function (valid) {
          _sendForm(res, {}, valid, { initial: true });
        });

      } else {

        var parsed = api.parse(body, 'httppost');

        if (!parsed.valid) {
          _sendError(res, parsed.error);
        } else {
          _serialize(parsed.result, function (serialized) {
            if (serialized.valid) {
              _sendOk(res, templates.result({
                result: JSON.stringify(parsed.result)
              }));
            } else {
              _sendForm(res, parsed.result, serialized);
            }
          });
        }

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

    [ { name: 'render', template: 'template.html' },
      { name: 'result', template: 'template-results.html' } ], 

    /* Iterator function */
    function (_template, _callback) {

      fs.readFile(_template.template, 'utf8', function (err, data) {

        if (!err) {
          templates[_template.name] = handlebars.compile(data);
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
