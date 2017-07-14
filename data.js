module.exports = {
  confMap: {},
  userMap: {},
  usersInfo: {},
  addConf: function(confNum, confID) {
    this.confMap[confNum] = confID;
  },
  addUser: function(userNum, userID) {
    this.userMap[userNum] = userID;
  },
  addUserToConf: function(confID, userID, body) {
    console.log("recieved -> ", body);
    
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
  }
};
