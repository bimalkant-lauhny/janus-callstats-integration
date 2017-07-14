const fs = require('fs');
const https = require('https');
const http = require('http');

const config = require('./config');
const callstats = require('./callstats');
const eventHandler = require('./eventHandler');
const serverOptions = {
  key: fs.readFileSync('./ssl/server.key'),
  cert: fs.readFileSync('./ssl/server.crt'),
  requestCert: false,
  rejectUnauthorized: false
}
;
callstats.authenticate()
.then(function(token) {
  console.log('Successfully recieved the token!', token);
  server = http.createServer(function(req, res) {
    var body = "";
    req.on("data", (chunk) => {
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
})
.catch(function (err) {
  console.log("Inside index catch");
  throw err.message;
});

