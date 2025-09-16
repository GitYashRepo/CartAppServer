const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    files: 5, // Max 5 files
  },
});

module.exports = upload;
