const data = require('./data');
const callstats = require('./callstats');

exports.handleEvent = function (event) {
  
  switch(event['type']) {
    case 1: sessionEventHandler(event);
      break;
    case 2: handleEventHandler(event);
      break;
    case 8: jsepEventHandler(event);
      break;
    case 16: webrtcEventHandler(event);
      break;
    case 32: mediaEventHandler(event);
      break;
    case 64: pluginEventHandler(event);
      break;
    case 128: transportEventHandler(event);
      break;
    case 256: coreEventHandler(event);
      break;
    default: 
      console.error("Unknown type of event! ", event);
  }
};

var sessionEventHandler = event => {
  
};

var handleEventHandler = event => {
  console.log("Handle Event: type 2", event);
  var OID = event['event']['opaque_id'];
  if(OID){
    OID = JSON.parse(OID);
    for (let key in OID) {
      if (typeof(OID[key]) === 'string') {
        OID[key] = OID[key].replace(/ /g, '');
      }
    }
    var confID = OID['confID'];
    var confNum = OID['confNum'];
    var userID = OID['userID'];
    data.addConf(confNum, confID);
    data.addUserToConf(confID, userID, OID);
    logInfo();
  }
};

var jsepEventHandler = event => {
  
};

var webrtcEventHandler = event => {
  
};

var mediaEventHandler = event => {
  
};

var pluginEventHandler = event => {
  console.log("Plugin Event: type 64", event);
  var dataObj = event['event']['data'];
  if (dataObj) {
    if (dataObj['event'] === 'joined') {
      var userID = dataObj['display'];
      var userNum = dataObj['id'];
      var confID = data.confMap[dataObj['room']];
      var userData = data.getUserInConf(confID, userID);
      var body = {
        localID: userID, 
        deviceID: userData['deviceID'], 
        timestamp: Number(event['timestamp'])/1000000
      };
      data.addUser(userNum, userID);
      if (confID) {
        callstats.authenticate(userID)
        .then(function(token){
          console.log("\n::: Recieved Token Successfully! :::\n", token, "\n");
          data.addKeyToUserWithinConf(confID, userID, 'token', token);
          logInfo();
          return callstats.userJoined(confID, body, token);
        })
        .then(function(ucID) {
          console.log("\n::: Recieved ucID Successfully! ::: ", ucID, "\n");
          data.addKeyToUserWithinConf(confID, userID, 'ucID', ucID);
          logInfo();
          var user = data.getUserInConf(confID, userID);
          return callstats.fabricSetup(confID, body, user['token'], user['ucID']);
        })
        .then(function(msg){
          console.log("::: FabricSetup response :::", msg);
          var user = data.getUserInConf(confID, userID);
          callstats.userAlive(confID, body, user['token'], user['ucID']);
        })
        .catch(function(err){
          console.error("this is bad", err);
        });
      } else {
        console.error('Unknown user data: ', event);
      }
    } else if(dataObj['event'] === 'unpublished') {
      console.log("::: deleting data :::");
      var userNum = dataObj['id'];
      var userID = data.userMap[userNum]; 
      var confNum = dataObj['room']
      var confID = data.confMap[confNum];
      var userData = data.getUserInConf(confID, userID);
      var body = {
        localID: userID, 
        deviceID: userData['deviceID'], 
        timestamp: Number(event['timestamp'])/1000000
      };
      console.log("::: Detail :::", userID, confID);
      var user = data.getUserInConf(confID, userID); 
      if (userID && confID) {
        callstats.userLeft(confID, body, user['token'], user['ucID'])
        .then(function(msg) {
          console.log("User Left success: ", msg);
        })
        .catch(function(err){
          console.error("User Left error: ", err);
        });
        delete data.userMap[userNum];
        data.removeUserFromConf(confID, userID);
        logInfo();
      }
    }
  }
};

var transportEventHandler = event => {
  
};

var coreEventHandler = event => {
  console.log('core event: ', event);
};


function logInfo() {
  console.log("Current userMap: ", data.userMap);
  console.log("Current confMap: ", data.confMap);
  console.log("Current usersInfo: ", data.usersInfo);
  
}
