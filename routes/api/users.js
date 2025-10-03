require("dotenv").config();

var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../../models");
const { isAuthenticated } = require("../../middleware/authMiddleware");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).send({ msg: "Fill All the Required fields" });
    }

    // Check if user exists
    const userExists = await db.User.findOne({ email });

    if (userExists) {
      return res.status(400).send({ msg: "Email Already Exist" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).send({ msg: "Invalid user data" });
    }
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post("/token", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check for user email
    const user = await db.User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        token: generateToken(user._id),
        permissions: ["super_admin", "customer"],
      });
    } else {
      res.status(400).send({ msg: "Invalid credentials" });
      // throw new Error("Invalid credentials");
    }
  } catch (err) {
    console.log(err);
    res.status(503).send({ msg: "Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check for user email
    const user = await db.User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error("Invalid credentials");
    }
  } catch (err) {
    console.log(err);
    res.status(503).send({ msg: "Server Error" });
  }
});

router.get("/me", isAuthenticated, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
};

module.exports = router;
