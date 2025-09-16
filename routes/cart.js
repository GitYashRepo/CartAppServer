    const express = require("express");
    const router = express.Router();
    const { userIsLoggedIn } = require("../middlewares/admin");
    const { GetCart, AddToCart, RemoveItemsFromCart, EmptyCart, UpdateCartItem } = require("../AppController/cartCont");

    // GET /cart — Show cart
    router.get("/", userIsLoggedIn, GetCart);
    // ADD to cart
    router.get("/add/:id", userIsLoggedIn, AddToCart);
    // REMOVE from cart (decrease quantity or remove completely)
    router.get("/remove/:id", userIsLoggedIn, RemoveItemsFromCart);
    // Empty-Cart
    router.post("/clear", userIsLoggedIn, EmptyCart);
    // Update Cart
    router.patch("/update/:id", userIsLoggedIn, UpdateCartItem);


    module.exports = router;
