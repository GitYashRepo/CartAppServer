const express = require('express')
const { uploadQR, getQR } = require("../AppController/qrCodeCont.js");
const upload = require("../config/multer_config.js");

const router = express.Router();

// Upload QR code
router.post("/upload", upload.single("qrCodeImage"), uploadQR);
router.get("/:productId", getQR);

module.exports = router;
