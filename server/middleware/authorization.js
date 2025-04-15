const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    const jwtToken = req.header("token");

    if (!jwtToken) {
      return res.status(403).json("Not authorized");
    }

    const jwtpayload = jwt.verify(jwtToken, process.env.jwtSecret);

    req.user = jwtpayload;
    next()
  } catch (err) {
    return res.status(403).json("Not authorized");
  }
};
