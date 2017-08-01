const data = require('./data');
const callstats = require('./callstats');
const sdpTransform = require('sdp-transform');

exports.handleEvent = function handleEvent (event) {
  if (Array.isArray(event)) {
    for ( let i of event) {
      handleEvent(i); 
    }
  } else {
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
  }
};

var sessionEventHandler = event => {
  
};

var handleEventHandler = event => {
  console.log("Handle Event: type 2", event);
  
  var eventName = event['event']['name'];
  var handleID = toString(event['handle_id']);
  var sessionID = toString(event['session_id']);
  data.addKeyToSession(sessionID, handleID, {});
  if (eventName === 'attached') {
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
      data.addKeyToSession(sessionID, "opaqueID", OID);
    }
  } else if (eventName === 'detached') {
    data.removeHandleFromSession(sessionID, handleID);
  }
  logInfo();
};

// event handler functions

function jsepEventHandler(event) {
  console.log("JSEP Event: type 8", event);
  var handleID = toString(event['handle_id']);
  var sessionID = toString(event['session_id']);
  var owner = event['event']['owner'];
  if (owner === 'remote') {
    var sdp = event['event']['jsep']['sdp'];
    sdp = sdpTransform.parse(sdp);
    var mediaArray = sdp['media'];
    for (let media of mediaArray) {
      let mediaType = media['type'];
      console.log("::: Media :::", media);
      let ssrc = media['ssrcs'][0]['id'];
      if (mediaType === 'audio'){
        data.addKeyToHandleWithinSession(sessionID, handleID, "audio-ssrc", ssrc);
      } else if (mediaType === 'video') {
        data.addKeyToHandleWithinSession(sessionID, handleID, "video-ssrc", ssrc);
      }
    }
  }
  logInfo();
}

function webrtcEventHandler(event){
  console.log("WebRTC Event: type 32", event);
  var handleID = toString(event['handle_id']);
  var sessionID = toString(event['session_id']);
  var eventData = event['event'];
  if(eventData['selected-pair']) {
    let pair = eventData['selected-pair'];
    pair = pair.split(/ <-> /g);
    let local = pair[0].split(/\s/g);
    let remote = pair[1].split(/\s/g);
    local[1] = local[1].replace(/\[|\]/g, '').split(',');
    remote[1] = remote[1].replace(/\[|\]/g, '').split(',');
    let localCandidate = {
      'address':local[0],
      'typ': local[1][0],
      'transport': local[1][1]
    };
    let remoteCandidate = {
      'address': remote[0],
      'typ': remote[1][0],
      'transport': remote[1][1]
    };
    data.addKeyToHandleWithinSession(sessionID, handleID, "local-candidate", localCandidate);
    data.addKeyToHandleWithinSession(sessionID, handleID, "remote-candidate", remoteCandidate);
  }
  logInfo();
}

function mediaEventHandler(event) {
  console.log('Media Event: type 32 ');
  var handleID = toString(event['handle_id']);
  var sessionID = toString(event['session_id']);
  var eventData = event['event'];
  if (eventData['base']) {
    let media = eventData['media'];
    let handle = data.getKeyInSession(sessionID, handleID);
    let localCandidate = handle['local-candidate'];
    let remoteCandidate = handle['remote-candidate'];
    let track = {
      "reportType": "local",
      "bytesSent" : eventData['bytes-sent'],
      "type": "ssrc",
      "packetsSent": eventData['packets-sent'],
      "timestamp": Date.now()/1000
    };
    let candidatePair = {
      "googRemoteAddress": remoteCandidate['address'],
      "googRemoteCandidateType":remoteCandidate['typ'],
      "googTransportType": remoteCandidate['transport'],
      "type": "googCandidatePair",
      "googLocalAddress": localCandidate['address'],
      "googLocalCandidateType": "local",
      "timestamp": Date.now()/1000
    };
    if (media === 'audio') {
      track['mediaType'] = 'audio';
      track['ssrc'] = toString(handle['audio-ssrc']);
      track["googCodecName"] = "opus";
    } else if (media === 'video'){
      track['mediaType'] = 'video';
      track['ssrc'] = toString(handle['video-ssrc']);
      track["googCodecName"] = "VP8";
    }
    callstats.submitStats(data.getKeyInSession(sessionID, "opaqueID"), track, candidatePair)
    .then(function(res) {
      console.log("submitStats Done!", res);
    })
    .catch(function(err) {
      console.log("submitStats Failed! ", err);
    });
  }
}

function pluginEventHandler(event){
  console.log("Plugin Event: type 64", event);
  var dataObj = event['event']['data'];
  var eventName = dataObj['event']; 
  
  if (eventName === 'joined') {
    var userID = dataObj['display'];
    var userNum = dataObj['id'];
    data.addUser(userNum, userID);
    var confID = data.confMap[dataObj['room']];
    var userData = data.getUserInConf(confID, userID);
    var body = {
      localID: userID, 
      deviceID: userData['deviceID'], 
      timestamp: Number(event['timestamp'])/1000000
    };
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
  } else if(eventName === 'unpublished') {
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

function transportEventHandler(event){
  
}

function coreEventHandler(event){
  var eventName = event['event']['status'];
  if (eventName === 'started') {
    console.log("::: Started Janus Instance! :::");
  } else if (eventName === 'shutdown'){
    console.log("::: Closed Janus Instance! :::");
  }
}

// extra functions
function logInfo() {
  console.log("Current userMap: ", data.userMap);
  console.log("Current confMap: ", data.confMap);
  console.log("Current usersInfo: ", data.usersInfo);
  console.log("Current sessionInfo", data.sessionInfo);
}

function toString(item) {
  return '' + item;
}
