const data = require('./data');
const callstats = require('./callstats');

exports.handleEvent = function (event) {
  
//   console.log(event);
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
    data.addConf(OID['confNum'], OID['confID']);
    data.addUserToConf(OID['confID'], OID['userID'], OID);
  }
  console.log("Current usersInfo: ", data.usersInfo);
  console.log("Current usersMap: ", data.userMap);
  console.log("Current confMap: ", data.confMap);
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
      var userNum = dataObj['id']
      var confID = data.confMap[dataObj['room']];
      var userData = data.getUserInConf(confID, userID);
      data.addUser(userNum, userID);
      if (confID) {
        callstats.userJoined(confID, {localID: userID, 
                                      deviceID: userData['deviceID'], 
                                      timestamp: Number(dataObj['timestamp'])/1000000})
        .then(function(ucID) {
          console.log('Recieved ucID: ', ucID);
          data.addKeyToUserWithinConf(confID, userID, 'ucID', ucID);
        })
        .catch(function(err){
          console.error("Did not recieve ucID: ", err.message);
        });
      } else {
        console.error('Unknown user data: ', event);
      }
    }
  }
  console.log("Current usersMap: ", data.userMap);
  console.log("Current confMap: ", data.confMap);
  console.log("Current usersInfo: ", data.usersInfo);
  
};

var transportEventHandler = event => {
  
};

var coreEventHandler = event => {
  console.log('core event: ', event);
};
