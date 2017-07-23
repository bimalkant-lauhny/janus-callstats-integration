const request = require('request-promise');
const jwtProvider = require('./jwt-provider');
const config = require('./config');
const os = require('os');
const rq = require('request-http2');
const data = require('./data');
const req = require('spdy');

const callstats = {
  version: '1.0.0',
  authenticate: function (userID){
   
    var options = {
      method: 'POST',
      uri: 'https://auth.callstats.io/authenticate',
      form: {
        grant_type: 'authorization_code',
        client_id: userID + '@' + config.appID ,
        code: jwtProvider.getJWT(userID)
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    }; 
    console.log("\n::: Authenticate options :::");
    console.log(options, "\n");
    return request(options)
            .then((token) => {
              token = JSON.parse(token);
              return token['access_token'];
            });
  },
  
  userJoined: function(confID, body, token) {
    var options = {
      method: 'POST',
      uri: 'https://events.callstats.io/v1/apps/' 
               + config.appID + '/conferences/' + confID,
      http2: true,
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      body: {
       "localID": body.localID, 
       "deviceID": body.deviceID,
       "timestamp": body.timestamp,
       "endpointInfo": {
         "type": "middlebox",
         "buildName": "Janus",
         "buildVersion": "Janus " + config.janusVersion, 
         "appVersion": config.jangoutsVersion 
       } 
      },
      json: true
    }; 
    console.log("\n::: UserJoined Options ::: ");
    console.log(options, "\n");
    
    return new Promise(function(resolve, reject){
      rq(options, function(err, res, body) {
        if (err)  {
          reject(err);
        }
        console.log(body);
        if (body['status'] === 'error') {
          reject(body['msg']);
        }
        resolve(body['ucID']);
      })
    });
  },
  userAlive: function(confID, body, token, ucID) {
    var options = {
      method: 'POST',
      uri: 'https://events.callstats.io/v1/apps/' 
               + config.appID + '/conferences/' + confID
               + '/' + ucID + '/events/user/alive',
      http2: true,
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      body: {
       "localID": body.localID, 
       "deviceID": body.deviceID,
       "timestamp": Date.now()/1000 
      },
      json: true
    };
    
    function sendEvent() {
      options.body['timestamp'] = Date.now()/1000;
      rq(options, function(err, res, body) {
        if (err)  {
          console.error("UserAlive Error: ", err.message);
        } else {
          console.log("UserAlive response: \n", body);
        }
      });
      
      var user = data.getUserInConf(confID, body.localID);
      if (user) {
        setTimeout(sendEvent, 10000);
      }
    }
    
    sendEvent();
  },
  userLeft: function(confID, body, token, ucID) {
    var options = {
      method: 'POST',
      uri: 'https://events.callstats.io/v1/apps/' 
               + config.appID + '/conferences/' + confID
               + '/' + ucID + '/events/user/left',
      http2: true,
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      body: {
       "localID": body.localID, 
       "deviceID": body.deviceID,
       "timestamp": Date.now()/1000
      },
      json: true
    };
      
    return new Promise(function(resolve, reject){
      rq(options, function(err, res, body) {
        if (err)  {
          reject(err);
        }
        if (body['status'] === 'error') {
          reject(body['msg']);
        } else {
          resolve(body['msg'])
        }
      })
    });
  },
  fabricSetup: function(confID, body, token, ucID) {
    var options = {
      method: 'POST',
      uri:  'https://events.callstats.io/v1/apps/' + 
            config.appID + '/conferences/' +
            confID + '/' + ucID + '/events/fabric',
      http2: true,
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      body: {
       "localID": body.localID, 
       "deviceID": body.deviceID,
       "timestamp": Date.now()/1000,
       "remoteID": "Janus", 
       "connectionID": ucID,
       "eventType": "fabricSetup"
      },
      json: true
    };
    
    return new Promise(function(resolve, reject){
      rq(options, function(err, res, body) {
        if (err)  {
          console.log("This is error::: ", err);
          reject(err);
        }
        resolve(body)
      })
    });
    
  }
};

module.exports = callstats;
