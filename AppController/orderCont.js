const paymentModel = require("../models/payment")
const orderModel = require("../models/order")
const cartModel = require("../models/cart")
const productModel = require("../models/product")
const jwt = require("jsonwebtoken")


const CreateOrder = async (req, res) => {
  try {
    const { orderid, paymentid, signature, userid } = req.params;

    const paymentDetails = await paymentModel.findOne({ orderId: orderid });

    const existingOrder = await orderModel.findOne({ orderId: orderid });
    if (existingOrder) {
      return res.status(200).json({
        status: "duplicate",
        message: "Order already exists",
        order: existingOrder,
      });
    }

    if (!paymentDetails) {
      return res.status(404).send("Sorry, this order does not exist!");
    }

    if (signature !== paymentDetails.signature || paymentid !== paymentDetails.paymentId) {
      return res.status(400).send("Invalid Payment");
    }

    const cart = await cartModel.findOne({ user: userid });

    if (!cart || !cart.products || cart.products.length === 0) {
      return res.status(400).send("Cart not found or is empty");
    }

    const outOfStockProducts = [];

    for (const item of cart.products) {
      const product = await productModel.findById(item.product);
      if (!product || product.stock < item.quantity) {
        outOfStockProducts.push(product?.name || "Unknown Product");
      }
    }

    if (outOfStockProducts.length > 0) {
      return res.status(400).send(
        `The following products are out of stock: ${outOfStockProducts.join(", ")}`
      );
    }

    // Deduct stock
    for (const item of cart.products) {
      const product = await productModel.findById(item.product);
      product.stock -= item.quantity;
      await product.save();
    }

    const newOrder = await orderModel.create({
      orderId: orderid,
      user: userid,
      products: cart.products,
      totalPrice: cart.totalPrice,
      status: "order placed",
      payment: paymentDetails._id,
    });

    await cartModel.deleteOne({ user: userid });

    return res.status(200).json({
      status: "success",
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (err) {
    console.error("❌ CreateOrder error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const ProvideAdressForOrder = async (req, res) => {
  try {
    const { orderid } = req.params;
    const {
      fullName,
      phone,
      street,
      city,
      state,
      pincode,
    } = req.body.address || {};

    // 1. Basic validation
    if (!fullName || !phone || !street || !city || !state || !pincode) {
      return res.status(400).json({
        error: "All address fields are required: fullName, phone, street, city, state, pincode",
      });
    }

    const order = await orderModel.findOne({ orderId: req.params.orderid });

    if (!order) return res.status(404).send("Sorry, this order doesn't exist");

    order.address = {
      fullName,
      phone,
      street,
      city,
      state,
      pincode,
    };
    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Address provided successfully",
      order,
    });
  } catch (err) {
    console.error("❌ ProvideAddress error:", err.message);
    return res.status(500).json({ error: "Failed to save address" });
  }
};

const getUserOrders = async (req, res) => {
  const token = req.cookies.token;
  const { userid } = req.params;

  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id !== userid) {
      return res.status(403).json({ message: "Forbidden: Invalid user ID" });
    }

    const orders = await orderModel
      .find({ user: userid })
      .populate("products.product", "name price discountedPrice")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ getUserOrders error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  CreateOrder,
  ProvideAdressForOrder,
  getUserOrders
};
