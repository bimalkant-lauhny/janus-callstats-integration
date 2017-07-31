const fs = require('fs');
const spdy = require('spdy');
const https = require('https');
const config = require('./config');
const eventHandler = require('./eventHandler');

const serverOptions = {
  key: fs.readFileSync(config.keyPath),
  cert: fs.readFileSync(config.crtPath),
  requestCert: false,
  rejectUnauthorized: false,
  spdy: {
    protocols: ['h2'],
    plain: true 
  }
};

var server = spdy.createServer(serverOptions, function(req, res) {
  var body = "";
  req.on("data", function (chunk) {
    body += chunk;
  });
  req.on("end", function () {
    // Got an event, parse and handle it
    try {
      var json = JSON.parse(body);
    } catch(e) {
      console.error("Error parsing event!");
    }
    eventHandler.handleEvent(json);
    // Done here
    res.writeHead(200);
    res.end(); 
  });
}).on('error', function(err) {
  throw err.message;
}).listen(config.port, function(){
  console.log(`Server started listening at port ${config.port}! Now start the Janus instance!`);
});

