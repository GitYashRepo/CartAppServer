const express = require("express");
const { UserLogout, ProfileRoute, RegisterUser, LoginUser } = require("../AppController/userCont");
const { userIsLoggedIn } = require("../middlewares/admin");
const router = express.Router();

// Register user (POST)
router.post("/register", RegisterUser);
// Login user (POST)
router.post("/login", LoginUser);
// Logout user (GET or POST)
router.get("/logout", UserLogout);
// Get profile (GET)
router.get("/me", userIsLoggedIn , ProfileRoute);

module.exports = router;
