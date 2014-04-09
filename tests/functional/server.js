var _ = require('underscore'),
    http = require('http'),
    async = require('async'),
    fs = require('fs'),
    handlebars = require('handlebars'),
    qs = require('querystring'),
    api = require('../../lib/api').create(),
    render = require('../../lib/render'),
    server,
    formDefinition,
    templates = {};

var _serialize = function (parsed, callback) {
  api.load([formDefinition], function(_result) {
    if (!_result.valid) {
      console.log('Failed loading form: ' + JSON.stringify(_result));
      return callback(_result);
    }
    var submission = _.extend({$form: 'TEST'}, parsed); 
    api.fill(submission, function(_result) {
      callback(_result);
    });
  });
};

var _sendOk = function (res, content) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(content);
};

var _sendError = function (res, error) {
  console.log(error);
  res.writeHead(500, {'Content-Type': 'text/html'});
};

var _sendForm = function(res, parsed, valid) {
  var form = render.render_form(formDefinition, parsed, valid);
  if (!form.valid) {
    _sendError(res, form.error);
  } else {
    _sendOk(res, templates.render({ form: form.result }));
  }
};

var _startServer = function (callback) {
  server = http.createServer(function (req, res) {
    var body = '';
    req.on('data', function (data) {
      body += data;
    });
    req.on('end', function () {
      if (req.method === 'GET') {
        formDefinition = JSON.parse(unescape(req.url.split('=')[1]));
        _sendForm(res);
      } else {
        var parsed = qs.parse(body);
        _serialize(parsed, function(valid) {
          if (valid.valid) {
            _sendOk(res, templates.result({
              result: JSON.stringify(parsed)
            }));
          } else {
            _sendForm(res, parsed, valid);
          }
        });
      }
    });
  });

  server.listen(7357, 'localhost', function() {
    console.log('Server running at http://localhost:7357/');
    callback();
  });
};

exports.stop = function() {
  console.log('Server shutting down');
  server.close();
};

exports.start = function(callback) {

  if (server) {
    return callback('Stop the server before starting a new one');
  }

  async.map(
    [
      {name: 'render', template: 'template.html'},
      {name: 'result', template: 'template-results.html'}
    ], 
    function (_template, _callback) {
      fs.readFile(_template.template, 'utf8', function (err, data) {
        if (err) {
          return _callback(err);
        }
        return _callback(null, {
          name: _template.name,
          template: handlebars.compile(data)
        });
      });
    }, 
    function (_err, _results) {
      if (_err) {
        return callback(err);
      }
      _.each(_results, function(result) {
        templates[result.name] = result.template;
      });
      _startServer(callback);
    }
  );

};
