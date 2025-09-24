
const jwt = require("jsonwebtoken")
const userModel = require("../models/user")

// Register new user
const RegisterUser = async (req, res) => {
  const { firstname, lastname, phone } = req.body;

  try {
    if (!firstname || !lastname || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if phone already exists
    let user = await userModel.findOne({ phone });
    if (user) {
      // If user exists, still generate token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(200).json({ message: "User already exists", user });
    }

    user = new userModel({ firstname, lastname, phone });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.status(201).json({ message: "Registered and logged in", user });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  RegisterUser,
};
