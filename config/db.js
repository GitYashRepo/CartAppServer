const mongoose = require("mongoose");

let isConnected = false;

const connectToDb = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.DB_CONNECT);
    isConnected = true;
    console.log("✅ MongoDB connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // optional: exit process if connection fails
  }
};

module.exports = connectToDb;
