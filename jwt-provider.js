const jwt = require('jsonwebtoken');
const fs = require('fs');
const config = require('./config');

const jwtProvider = {
  getJWT: function(userID) {
    var privateKey = fs.readFileSync(config.privateKeyPath);
    return jwt.sign({
      userID: userID,
      appID: config.appID,
      keyID: config.keyID
    }, privateKey, {
      algorithm: 'ES256',
      expiresIn: 300,
      notBefore: -300
    });
  }
};

module.exports = jwtProvider;
