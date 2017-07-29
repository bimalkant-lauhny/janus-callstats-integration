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
  addHandleToSession: function(sessionID, handleID, body) {
    if(this.sessionInfo[sessionID] === undefined) {
      this.sessionInfo[sessionID] = {};
    }
    var temp = this.sessionInfo[sessionID];
    temp[handleID] = body;
  },
  addKeyToHandleWithinSession: function(sessionID, handleID, key, val) {
    this.sessionInfo[sessionID][handleID][key] = val;
  },
  getHandleInSession: function(sessionID, handleID) {
    return this.sessionInfo[sessionID][handleID];
  },
  removeHandleFromSession: function(sessionID, handleID) {
    delete this.sessionInfo[sessionID][handleID];
  }
};
