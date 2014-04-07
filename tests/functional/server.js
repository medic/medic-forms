var _ = require('underscore'),
    http = require('http'),
    fs = require('fs'),
    handlebars = require('handlebars'),
    qs = require('querystring'),
    input = require('../../lib/input'),
    render = require('../../lib/render'),
    server,
    pageForm,
    pageResults,
    formDefinition;

var serialize = function(parsed, callback) {
  input.validate([formDefinition], 'TEST', parsed, function(result) {
    callback(result, parsed);
  });
};

var sendOk = function(res, context) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(context);
}

exports.stop = function() {
  console.log('Server shutting down');
  server.close();
};

exports.start = function(callback) {

  if (server) {
    return callback('Stop the server before starting a new one');
  }

  // TODO clean up template compilation
  fs.readFile('template.html', 'utf8', function (err, data) {

    if (err) {
      return callback(err);
    }

    pageForm = handlebars.compile(data);

    fs.readFile('template-results.html', 'utf8', function (err, data) {

      if (err) {
        return callback(err);
      }
      pageResults = handlebars.compile(data);

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
                sendOk(res, pageForm({
                  form: html
                }));
              }
            );
          } else {
            var parsed = qs.parse(body);
            serialize(parsed, function(valid, serialized) {
              if (valid.valid) {
                sendOk(res, pageResults({
                  result: JSON.stringify(serialized)
                }));
              } else {
                render.render_all(
                  JSON.parse(formDefinition),
                  function(err, html) {
                    sendOk(res, pageForm({
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
    });
  });
};
