const jwt = require("jsonwebtoken")
require('dotenv').config();

function jwtGenerator(user) {
  const payload = { ...user}

  delete payload.user_password;

  return jwt.sign(payload, process.env.jwtSecret, {expiresIn: "1hr"})
}

module.exports = jwtGenerator