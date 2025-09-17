const express = require("express");
const { RegisterUser, } = require("../AppController/userCont");
const { userIsLoggedIn } = require("../middlewares/admin");
const router = express.Router();

// Register user (POST)
router.post("/register",userIsLoggedIn, RegisterUser);

module.exports = router;
