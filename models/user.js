const mongoose = require("mongoose");

// User Schema with Mongoose Validation
const userSchema = mongoose.Schema(
    {
        firstname: {
            type: String,
            minlength: 2,
            required: true,
        },
        lastname: {
            type: String,
            minlength: 2,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
        },
        password: {
            type: String,
            minlength: 3,
            required: function () {
                return !this.googleId;
            }
        },
        phone: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^\d{10}$/.test(v);
            },
            message: "Phone number must be a 10-digit number",
          },
        },
    },
    { timestamps: true }
);
const userModel = mongoose.model("user", userSchema);


module.exports = userModel;
