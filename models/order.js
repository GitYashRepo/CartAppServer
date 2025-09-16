const mongoose = require("mongoose");

// Order Schema with Mongoose Validation
const orderSchema = mongoose.Schema({
    orderId:{
        type:String,
        required: true,
        unique: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "User ID is required"],
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
        min: [0, "Total price cannot be negative"],
    },
    address: {
        fullName: { type: String, required: false },
        phone: { type: String, required: false },
        street: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        pincode: { type: String, required: false },
    },
    status: {
        type: String,
        enum: ["pending", "order placed", "shipped", "delivered", "cancelled"],
        required: [true, "Order status is required"],
        default: "pending",
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment",
        required: [true, "Payment ID is required"],
    },
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "delivery",
        required: [false, "Delivery ID is required"],
    },
}, { timestamps: true });

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
