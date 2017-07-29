module.exports = {
  confMap: {},
  userMap: {},
  usersInfo: {},
  sessionInfo: {},
  addConf: function(confNum, confID) {
    this.confMap[confNum] = confID;
  },
  addUser: function(userNum, userID) {
    this.userMap[userNum] = userID;
  },
  addUserToConf: function(confID, userID, body) {
    if(this.usersInfo[confID] === undefined) {
      this.usersInfo[confID] = {};
    }
    var temp = this.usersInfo[confID];
    temp[userID] = body;
  },
  getUserInConf: function(confID, userID) {
    return this.usersInfo[confID][userID];
  },
  addKeyToUserWithinConf: function(confID, userID, key, val) {
    this.usersInfo[confID][userID][key] = val;
  },
  removeUserFromConf: function(confID, userID) {
    delete this.usersInfo[confID][userID];
  },
  addKeyToSession: function(sessionID, key, val) {
    if(this.sessionInfo[sessionID] === undefined) {
      this.sessionInfo[sessionID] = {};
    }
    var temp = this.sessionInfo[sessionID];
    temp[key] = val;
  },
  addKeyToHandleWithinSession: function(sessionID, handleID, key, val) {
    this.sessionInfo[sessionID][handleID][key] = val;
  },
  getKeyInSession: function(sessionID, key) {
    return this.sessionInfo[sessionID][key];
  },
  removeHandleFromSession: function(sessionID, handleID) {
    delete this.sessionInfo[sessionID][handleID];
  }
};
