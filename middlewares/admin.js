const jwt = require("jsonwebtoken");
require("dotenv").config();
const userModel = require("../models/user");

async function validateAdmin(req, res, next) {
  try {
    const token = req.cookies.admintoken;
    if (!token) return res.status(401).json({ message: "You need to login first" });

    const data = jwt.verify(token, process.env.JWT_SECRET);
    if (data.role !== "admin") {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }

    req.user = data;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

const userIsLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

module.exports = { validateAdmin, userIsLoggedIn };
