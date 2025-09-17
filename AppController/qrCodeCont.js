const QRCode = require("../models/qrCode");
const Product = require("../models/product");


const uploadQR = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ message: "Product ID is required" });
        if (!req.file) return res.status(400).json({ message: "QR code image is required" });

        // Verify product exists
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Save QR code to DB
        const qrCode = new QRCode({
            productId,
            qrImage: req.file.buffer,
            contentType: req.file.mimetype,
        });

        await qrCode.save();
        res.status(200).json({ message: "QR code uploaded successfully", qrCodeId: qrCode._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}


const getQR = async (req, res) => {
    try {
        const qr = await QRCode.findOne({ productId: req.params.productId });
        if (!qr) return res.status(404).json({ message: "QR code not found" });

        res.set("Content-Type", qr.contentType);
        res.send(qr.qrImage);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

const getQRCodeImage = async (req, res) => {
  try {
    const { productId } = req.params;

    // Look in QRCode collection, not Product
    const qr = await QRCode.findOne({ productId });
    if (!qr || !qr.qrImage) {
      return res.status(404).send("QR code image not found");
    }

    res.set("Content-Type", qr.contentType || "image/png");
    res.send(qr.qrImage); // send the binary buffer
  } catch (err) {
    console.error("Error fetching QR code image:", err.message);
    res.status(500).send("Server error");
  }
};



module.exports = {
    uploadQR,
    getQR,
    getQRCodeImage
}
