
var _ = require('underscore'),
    path = require('path'),
    http = require('http'),
    async = require('async'),
    fs = require('fs'),
    jsdump = require('jsDump'),
    handlebars = require('handlebars'),
    api = require('../../lib/api').create(),
    server, 
    templates = {},
    uat = false;

/* mmmmm dogfood */
var definitionSubmissionForm = {
  "meta": {
    "id": "DEFN"
  },
  "fields": [
    {
      "id": "formDefinition",
      "name": "Form Definition",
      "type": "json",
      "render": "textarea",
      "required": true
    }
  ]
};

/**
 * @name _fill:
 */
var _fill = function (definition, parsed, callback) {

  api.load([ definition ], function (_loaded) {

    if (!_loaded.valid) {
      return callback(_loaded);
    }

    api.fill(parsed, callback);
  });
};


/**
 * @name _sendOk:
 */
var _sendOk = function (res, content, options) {
  options = options || {};
  _.defaults(options, {mimetype: 'text/html'});
  res.writeHead(200, {'Content-Type': options.mimetype});
  res.end(content);
};

/**
 * @name _sendScript:
 */
var _sendScript = function(res, content) {
  _sendOk(res, content, { mimetype: 'application/javascript' });
};

/**
 * @name _sendStyle:
 */
var _sendStyle = function(res, content) {
  _sendOk(res, content, { mimetype: 'text/css' });
};

/**
 * @name _sendError:
 */
var _sendError = function (res, options) {
  options = options || {};
  _.defaults(options, { code: 500 });
  if (options.error) {
    console.log(options.error);
  }
  res.writeHead(options.code, {'Content-Type': 'text/html'});
  res.end();
};


/**
 * @name _sendForm:
 */
var _sendForm = function (res, formId, input, validation, options) {

  var form = api.render(
    formId, input, validation, options
  );

  if (form.valid || options.initial) {
    var content = templates.render({ 
      form: form.result, 
      showLinks: formId === 'DEFN',
      uat: uat
    });
    _sendOk(res, content);
  } else {
    _sendError(res, form.error);
  }
};

/**
 * @name _fillAndSendForm:
 */
var _fillAndSendForm = function(res, definition, input, options) {
  var formId = definition.meta.id;
  _fill(definition, {$form: formId}, function (filled) {
    if (!filled.valid && filled.phase === 'validate') {
      var validation = {
        detail: {
          formDefinition: {
            error: filled.detail.detail[0].error
          }
        }
      };
      _sendForm(res, 'DEFN', input, validation);
    } else {
      _sendForm(res, formId, input || {}, filled, { initial: true });
    }
  });
};

/**
 * @name _sendResult:
 */
var _sendResult = function(res, parsed) {
  api.fill(parsed.result, function (filled) {
    if (filled.valid) {
      delete parsed.result.$form;
      _sendOk(res, templates.result({
        result: JSON.stringify(parsed.result, null, '  ')
      }));
    } else {
      _sendForm(res, 'TEST', parsed.result, filled);
    }
  });
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
          _fillAndSendForm(res, definitionSubmissionForm);
        } else {

          var parsed = api.parse(body, 'httppost');
          if (!parsed.valid) {
            _sendError(res, { error: parsed.error });
          } else if (parsed.result.$form === 'DEFN') {
            _fill(definitionSubmissionForm, parsed.result, function(_filled) {
              if (_filled.valid) {
                var formDefinition = JSON.parse(parsed.result.formDefinition);
                _fillAndSendForm(res, formDefinition, parsed.result);
              } else {
                _sendForm(res, 'DEFN', parsed.result, _filled);
              }
            });
          } else {
            _sendResult(res, parsed);
          }
        }

      } else if (urlParts[0] === '/scripts/behavior.js') {
        _sendScript(res, templates.behavior);
      } else if (urlParts[0] === '/scripts/_uat.js') {
        _sendScript(res, templates.uat);
      } else if (urlParts[0] === '/style/style.css') {
        _sendStyle(res, templates.style);
      } else if (urlParts[0] === '/favicon.ico') {
        _sendError(res, { code: 404 });
      } else {
        _sendError(res, { error: 'Unknown resource: ' + req.url });
      }
    });
  });

  server.listen(7357, 'localhost', callback);
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
exports.start = function (_options, callback) {

  if (!callback) {
    callback = _options;
    _options = {};
  }
  uat = !!_options.uat;

  if (server) {
    return callback('Stop the server before starting a new one');
  }

  async.map(

    [ 
      { name: 'render', file: 'template.html', compile: true },
      { name: 'result', file: 'template-results.html', compile: true },
      { name: 'behavior', file: '../../lib/renderers/_behavior.js' },
      { name: 'uat', file: '_uat.js' },
      { name: 'style', file: '../../lib/renderers/_style.css' } 
    ],

    /* Iterator function */
    function (_template, _callback) {

      var fullpath = path.join(__dirname, _template.file);

      fs.readFile(fullpath, 'utf8', function (err, data) {

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
