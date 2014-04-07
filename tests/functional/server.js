var _ = require('underscore'),
    http = require('http'),
    async = require('async'),
    fs = require('fs'),
    handlebars = require('handlebars'),
    qs = require('querystring'),
    input = require('../../lib/input'),
    render = require('../../lib/render'),
    server,
    formDefinition,
    templates = {};

var _serialize = function (parsed, callback) {
  input.validate([formDefinition], 'TEST', parsed, function(result) {
    callback(result, parsed);
  });
};

var _sendOk = function (res, context) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(context);
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
        render.render_all(
          formDefinition,
          function(err, html) {
            _sendOk(res, templates.render({
              form: html
            }));
          }
        );
      } else {
        var parsed = qs.parse(body);
        _serialize(parsed, function(valid, serialized) {
          if (valid.valid) {
            _sendOk(res, templates.result({
              result: JSON.stringify(serialized)
            }));
          } else {
            render.render_all(
              JSON.parse(formDefinition),
              function(err, html) {
                _sendOk(res, templates.render({
                  form: html
                }));
              }
            )
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
