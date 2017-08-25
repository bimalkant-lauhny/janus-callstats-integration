const jwtProvider = require('./jwt-provider');
const config = require('./config');
const data = require('./data');
const http2 = require('http2');
const queryString = require('querystring');

const callstats = {
  
  version: '1.0.0',
  
  authenticate: function (userID){
    
    var payload = queryString.stringify({
        grant_type: 'authorization_code',
        client_id: userID + '@' + config.appID ,
        code: jwtProvider.getJWT(userID)
    });
    
    var options = {
      host: "auth.callstats.io",
      path: "/authenticate",
      method: "POST",
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    }; 
    
    return sendRequest(options, payload)
            .then(function(body){
              return body['access_token'];
            });
  },
  
  userJoined: function(confID, body, token) {
    
    var payload = JSON.stringify({
       "localID": body.localID, 
       "deviceID": body.deviceID,
       "timestamp": body.timestamp,
       "endpointInfo": {
         "type": "middlebox",
         "buildName": "Janus",
         "buildVersion": "Janus " + config.janusVersion, 
         "appVersion": config.jangoutsVersion 
       } 
    });
    
    var options = {
      method: "POST",
      host: "events.callstats.io",
      path: "/v1/apps/" + config.appID + "/conferences/" + confID,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer ' + token
      }
    };
    
    return sendRequest(options, payload)
            .then(function(body){
              if (body['status'] === 'error') {
                throw new Error (body['msg']);
              }
              return body['ucID'];
            });
  },
  
  userAlive: function userAlive(confID, body, token, ucID) {
    
    var payload = JSON.stringify({
      "localID": body.localID, 
      "deviceID": body.deviceID,
      "timestamp": Date.now()/1000 
    });
    
    var options = {
      host: "events.callstats.io",
      path: "/v1/apps/" + config.appID + "/conferences/" + confID
            + "/" + ucID + "/events/user/alive",
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer ' + token,
      }
    };
    
    sendRequest(options, payload)
    .then(function(body){
      if (body['status'] === 'error') {
        throw new Error("UserAlive unsuccessfull!");
      } else {
        console.log("UserAlive Successfull!");
      }
    })
    .catch(function(err){
      console.error("UserAlive Error: ", err.message);
    });
    
    var user = data.getUserInConf(confID, body.localID);
    if (user) {
      setTimeout(userAlive, 10000, confID, body, token, ucID);
    }
  },
  
  userLeft: function(confID, body, token, ucID) {
    
    var payload = JSON.stringify({
      "localID": body.localID, 
      "deviceID": body.deviceID,
      "timestamp": Date.now()/1000
    });
    
    var options = {
      host: "events.callstats.io",
      path: "/v1/apps/" + config.appID + "/conferences/" + confID
               + "/" + ucID + "/events/user/left",
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer ' + token
      }
    };
    
    return sendRequest(options, payload)
            .then(function(body) {
              if (body['status'] === 'error') {
                throw new Error(body['msg']);
              } else {
                return body['msg'];
              }
            });
  },
  
  fabricSetup: function(confID, body, token, ucID) {
    
    var payload = JSON.stringify({
      "localID": body.localID, 
      "deviceID": body.deviceID,
      "remoteID": "Janus", 
      "eventType": "fabricSetup",
      "connectionID": ucID,
      "timestamp": Date.now()/1000
    });
    
    var options = {
      host:  "events.callstats.io",
      path: "/v1/apps/" + config.appID + "/conferences/" 
            + confID + "/" + ucID + "/events/fabric",
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer ' + token,
      }
    };
    
    return sendRequest(options, payload);
  },
  
  submitStats: function(body, track, candidatePair) {
    
    var payload = JSON.stringify({
      "localID": body.userID, 
      "deviceID": body.deviceID,
      "remoteID": "Janus", 
      "connectionID": body.ucID,
      "timestamp": Date.now()/1000,
      "stats": [{
        "tracks": [track],
        "candidatePairs": [candidatePair],
        "timestamp": Date.now()/1000
      }]
    });
    
    var options = {
      host: "stats.callstats.io",
      path: "/v1/apps/" + config.appID + "/conferences/" 
            + body.confID + "/" + body.ucID + "/stats",
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': 'Bearer ' + body.token,
      }
    };
    
    return sendRequest(options, payload);
  }
  
};

module.exports = callstats;


function sendRequest(options, payload) {
  
  return new Promise(function(resolve, reject){
    
    var req = http2.request(options, function(res){
      var body = "";
      
      res.on("data", function(chunk) {
        body += chunk;
      });
      
      res.on("end", function() {
        body = JSON.parse(body);
        resolve(body);
      });
      
    });
    
    req.on("error", function(err){
      reject(err);
    });
    
    req.write(payload);
    req.end();
    
  });
} 
