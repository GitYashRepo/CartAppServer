const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const cartModel = require("../models/cart");
const orderModel = require("../models/order");
const productModel = require("../models/product");
const paymentModel = require("../models/payment");

// 🔑 Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const CreateRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await cartModel.findOne({ user: userId });

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ error: "Cart is empty or not found" });
    }

    const options = {
      amount: cart.totalPrice * 100,
      currency: "INR",
    };

    const order = await razorpay.orders.create(options);

    await paymentModel.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "pending",
      user: userId,
    });

    res.status(200).json(order);
  } catch (error) {
    console.error("Order creation failed:", error.message);
    res.status(500).json({ error: "Failed to create order" });
  }
}


const VerifyPaymentAndPlaceOrder = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: "Invalid payment signature" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;

    const payment = await paymentModel.findOne({
      orderId: razorpayOrderId,
      status: "pending",
    }).session(session);

    if (!payment) {
      throw new Error("Payment not found or already processed");
    }

    payment.paymentId = razorpayPaymentId;
    payment.signature = signature;
    payment.status = "completed";
    await payment.save({ session });

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("products.product")
      .session(session);

    if (!cart || cart.products.length === 0) {
      throw new Error("Cart is empty");
    }

    for (const item of cart.products) {
      const product = await productModel.findById(item.product._id).session(session);
      if (!product || product.stock < item.quantity) {
        throw new Error(`${product.name} is out of stock`);
      }
      product.stock -= item.quantity;
      await product.save({ session });
    }

    const newOrder = await orderModel.create(
      [{
        orderId: razorpayOrderId,
        user: userId,
        products: cart.products.map(p => ({
          product: p.product._id,
          quantity: p.quantity
        })),
        totalPrice: cart.totalPrice,
        status: "order placed",
        payment: payment._id,
      }],
      { session }
    );

    // await cartModel.deleteOne({ user: userId }).session(session);

    await session.commitTransaction();
    res.status(200).json({ status: "success", order: newOrder });
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment/order failed:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
}


module.exports = {
    CreateRazorpayOrder,
    VerifyPaymentAndPlaceOrder,
}
