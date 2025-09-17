const express = require('express')
const { uploadQR, getQR, getQRCodeImage } = require("../AppController/qrCodeCont.js");
const upload = require("../config/multer_config.js");

const router = express.Router();

// Upload QR code
router.post("/upload", upload.single("qrCodeImage"), uploadQR);
router.get("/:productId", getQR);
router.get("/image/:productId", getQRCodeImage);

module.exports = router;
