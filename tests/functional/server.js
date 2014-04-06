var _ = require('underscore'),
    http = require('http'),
    fs = require('fs'),
    handlebars = require('handlebars'),
    qs = require('querystring'),
    input = require('../../lib/input'),
    server,
    page;

// TODO should actually call the renderer
var render = function(form, errors) {
  var html = '<input type="hidden" name="formDefinition" value=\'' + JSON.stringify(form) + '\'/>';
  form.fields.forEach(function(field) {
    var errorMessage = '';
    if (errors && errors.detail[field.id]) {
      errorMessage = '<span class="error">' + errors.detail[field.id].error + '</span>';
    }
    html += '<div class="row-' + field.id + '">' + 
          errorMessage + 
          '<label>' + 
            field.name + 
            '<br/><input type="text" name="' + field.id + '"></input>' + 
          '</label></div>';
  });
  return html;
};

var serialize = function(parsed, callback) {
  var forms = [JSON.parse(parsed.formDefinition)];
  var serialized = _.omit(parsed, 'formDefinition', 'submit');
  input.validate(forms, 'TEST', serialized, function(result) {
    callback(result, serialized);
  });
};

var sendOk = function(res, context) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(page(context));
}

exports.stop = function() {
  console.log('Server shutting down');
  server.close();
};

exports.start = function(callback) {

  if (server) {
    return callback('Stop the server before starting a new one');
  }

  fs.readFile('template.html', 'utf8', function (err, data) {

    if (err) {
      return callback(err);
    }

    page = handlebars.compile(data);

    server = http.createServer(function (req, res) {
      if (req.url === '/') {
        var body = '';
        req.on('data', function (data) {
          body += data;
        });
        req.on('end', function () {
          var parsed = qs.parse(body);
          if (req.method === 'GET') {
            sendOk(res, {
              page: 'define',
              form: '<label>Form Definition<textarea name="formDefinition"></textarea></label>'
            });
          } else if (parsed.submit === 'define') {
            sendOk(res, {
              page: 'populate',
              form: render(JSON.parse(parsed.formDefinition))
            });
          } else if (parsed.submit === 'populate') {
            serialize(parsed, function(valid, serialized) {
              if (valid.valid) {
                sendOk(res, {
                  page: 'evaluate',
                  result: JSON.stringify(serialized)
                });
              } else {
                sendOk(res, {
                  page: 'populate',
                  form: render(
                    JSON.parse(parsed.formDefinition),
                    valid
                  )
                });
              }
            });
          } else {
            console.log('unknown page: ' + parsed.submit);
          }
        });

      } else {
        console.log('Unhandled url: ' + req.url);
        res.writeHead(403);
        res.end();
      }

    });

    server.listen(7357, 'localhost', function() {
      console.log('Server running at http://localhost:7357/');
      callback();
    });

  });
};
