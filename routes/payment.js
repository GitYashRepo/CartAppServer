require("dotenv").config();
const express = require("express");
const { userIsLoggedIn } = require("../middlewares/admin");
const { VerifyPaymentAndPlaceOrder, CreateRazorpayOrder } = require("../AppController/paymentCont");

const router = express.Router();


router.post("/create/orderId", CreateRazorpayOrder);
// 💳 VERIFY Razorpay Payment and Place Order
router.post("/api/payment/verify", VerifyPaymentAndPlaceOrder);

module.exports = router;
