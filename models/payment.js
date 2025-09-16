const mongoose = require("mongoose");

// Payment Schema with Mongoose Validation
const paymentSchema = mongoose.Schema({
    orderId: {
        type: String,
        required: [true, "Order ID is required"],
    },
    paymentId: {
        type: String,
    },
    signature: {
        type: String,
    },
    amount: {
        type: Number,
        required: [true, "Payment amount is required"],
    },
    currency: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }
}, { timestamps: true });

const paymentModel = mongoose.model("payment", paymentSchema);

module.exports = paymentModel ;
