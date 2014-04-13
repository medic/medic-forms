
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
    server.stop();
    if (err) {
      console.log('Test failed');
      console.log(err);
      process.exit(1);
    } else {
      console.log('Tests passed!');
      process.exit();
    }
  });
});

