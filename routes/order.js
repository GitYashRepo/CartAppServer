const express = require("express");
const { CreateOrder, ProvideAdressForOrder, getUserOrders } = require("../AppController/orderCont");
const router = express.Router();

router.get("/:userid/:orderid/:paymentid/:signature", CreateOrder);
router.post("/address/:orderid", ProvideAdressForOrder);
router.post("/getuserorders/:userid", getUserOrders);

module.exports = router;
