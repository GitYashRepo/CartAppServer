const express = require("express");
const { userIsLoggedIn } = require("../middlewares/admin");
const { RegisterUser } = require("../AppController/userCont");
const router = express.Router();

// Register user (POST)
router.post("/register", RegisterUser);
router.get("/me", userIsLoggedIn , (req, res) => {
  res.json(req.user);
});

module.exports = router;
