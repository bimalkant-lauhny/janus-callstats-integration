const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const config = require('./config');

const jwtProvider = {
  getJWT: function() {
    var privateKey = fs.readFileSync('./ssl/ecpriv.key');
    return jwt.sign({
      userID: config.username,
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
