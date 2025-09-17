    const express = require("express");
    const router = express.Router();
    const { GetCart, AddToCart, RemoveItemsFromCart, EmptyCart, UpdateCartItem } = require("../AppController/cartCont");

    // GET /cart — Show cart
    router.get("/", GetCart);
    // ADD to cart
    router.get("/add/:id", AddToCart);
    // REMOVE from cart (decrease quantity or remove completely)
    router.get("/remove/:id", RemoveItemsFromCart);
    // Empty-Cart
    router.post("/clear", EmptyCart);
    // Update Cart
    router.patch("/update/:id", UpdateCartItem);


    module.exports = router;
