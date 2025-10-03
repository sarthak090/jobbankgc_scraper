require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const isAuthenticated = async (req, res, next) => {
  
  next();
  return
  if (process.env.NODE_ENV === "development") {
    next();
    return;
  }
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];
      if (token == undefined) {
        res.status(400).json({ msg: "No Authentication Token Was Given" });
        return;
      }
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      console.log(error);
      return res.status(401).send({ msg: "Not authorized" });
      //   throw new Error("Not authorized");
    }
  }

  if (!token) {
    res.status(401).send({ msg: "Not authorized, no token" });
  }
};
module.exports = { isAuthenticated };
