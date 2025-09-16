const userModel = require("../models/user");
const { hashPassword, comparePasswords } = require("../utils/hash");
const jwt = require("jsonwebtoken");


const RegisterUser = async (req, res) => {
    const { firstname, lastname, email, password, phone } = req.body;
    try {
        let existingUser = await userModel.findOne({ email });

        // Case 1: User exists via Google or broken entry
        if (existingUser && (!existingUser.password || existingUser.password.trim() === "")) {
            existingUser.firstname = firstname;
            existingUser.lastname = lastname;
            existingUser.phone = phone;
            existingUser.password = await hashPassword(password);
            await existingUser.save();

            return res.status(200).json({ message: "User upgraded with password successfully" });
        }

        // Case 2: Proper manual user already exists
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Case 3: Brand new user
        const hashedPassword = await hashPassword(password);
        const user = new userModel({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            phone,
        });

        await user.save();
        return res.status(201).json({ message: "Registered successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};





const LoginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });

        if (!user || !user.password || user.password.trim() === "") {
            return res.status(400).json({ message: "Invalid credentials or use Google login" });
        }

        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Fallback if role is missing
        const userRole = user.role || "user";

        // Check secret
        if (!process.env.JWT_SECRET) {
            console.error("Missing JWT_SECRET in environment variables!");
            return res.status(500).json({ message: "Server misconfiguration" });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: userRole
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Set secure cookie
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        return res.status(200).json({ message: "Logged in", user });

    } catch (err) {
        console.error("Login error:", err); // 🔥 Now you’ll see what's wrong!
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};



// const ProfileRoute = async (req, res) => {
//     if (!req.isAuthenticated()) {
//         return res.status(401).json({ message: "Not authenticated" });
//     }

//     try {
//         const user = await userModel.findById(req.user._id).select("-password -googleId");
//         if (!user) return res.status(404).json({ message: "User not found" });
//         res.status(200).json(user);
//     } catch (error) {
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };

const ProfileRoute = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password -googleId");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const UserLogout = function(req, res, next) {
  req.logout(function(err) {
    if (err) return next(err);

    req.session.destroy(() => {
      if (err) return next(err);

      res.clearCookie("connect.sid", {
        path: "/",
        sameSite: "none",
        secure: true,
      });

      // 🔥 Add this to remove the JWT cookie
      res.clearCookie("token", {
        path: "/",
        sameSite: "none",
        secure: true,
      });

      return res.status(200).json({ message: "Logged out" });
    });
  });
};



module.exports = {
    RegisterUser,
    LoginUser,
    ProfileRoute,
    UserLogout
}
