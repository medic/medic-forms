var server = require('../tests/functional/server');

server.start({uat: true}, function(err) {
  console.log(err || 'Server running at http://localhost:7357/');
});