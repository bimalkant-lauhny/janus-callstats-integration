const request = require('request-promise');
const jwtProvider = require('./jwt-provider');
const config = require('./config');
const os = require('os');

const callstats = {
  version: '1.0.0',
  authenticate: function (){
   
    var options = {
      method: 'POST',
      uri: 'https://auth.callstats.io/authenticate',
      form: {
        grant_type: 'authorization_code',
        client_id: config.username + '@' + config.appID ,
        code: jwtProvider.getJWT()
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      }
    }; 
    var that = this;
    return request(options)
            .then((token) => {
              token = JSON.parse(token);
              that.accessToken = token['access_token'];
              return that.accessToken;
            });
  },
  
  userJoined: function(confID, body) {
    var token = this.accessToken;
    var options = {
      method: 'POST',
      uri: 'https://events.callstats.io/v1/apps/' 
               + config.appID + '/conferences/' + confID,
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      body: {
       "localID": body.localID, 
       "deviceID": body.deviceID,
       "timestamp": body.timestamp,
       "endpointInfo": {
         "type": "middlebox",
         "os": os.release(),
         "osVersion": os.release(),
         "buildName": "Janus",
         "buildVersion": "Janus " + config.janusVersion, 
         "appVersion": config.jangoutsVersion 
       } 
      },
      json: true
    }; 
    console.log("Request Options: ", options);
    return request(options)
            .then(function(ucID){
              return ucID;
            });
  }
};

module.exports = callstats;
