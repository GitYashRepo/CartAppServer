const express = require("express");
const router = express.Router();
const {
  GetCart,
  AddToCart,
  RemoveItemsFromCart,
  EmptyCart,
  UpdateCartItem,
} = require("../AppController/cartCont");

const { userIsLoggedIn } = require("../middlewares/admin");

// ✅ Show cart
router.get("/", userIsLoggedIn, GetCart);

// ✅ Add item to cart (POST matches frontend)
router.post("/add/:id", userIsLoggedIn, AddToCart);

// ✅ Remove one item (DELETE)
router.delete("/remove/:id", userIsLoggedIn, RemoveItemsFromCart);

// ✅ Empty entire cart
router.delete("/clear", userIsLoggedIn, EmptyCart);

// ✅ Update quantity
router.patch("/update/:id", userIsLoggedIn, UpdateCartItem);

module.exports = router;
