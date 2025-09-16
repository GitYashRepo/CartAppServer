const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    qrImage: {
        type: Buffer, // store image in memory
        required: true,
    },
    contentType: {
        type: String, // e.g., "image/png"
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

const qrCodeModel = mongoose.model("QRCode", qrCodeSchema);

module.exports = qrCodeModel;
