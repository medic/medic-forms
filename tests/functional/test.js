var child_process = require('child_process'),
  server = require('./server'),
  runner = require('./runner');

console.log();
console.log('Starting Functional Tests');
server.start(function(err) {
  if (err) {
    console.log(err);
    server.stop();
  }
  runner.run(function(err) {
    if (err) {
      console.log(err);
    }
    server.stop();
  });
});