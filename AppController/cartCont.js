const cartModel = require("../models/cart");
const productModel = require("../models/product");

const recalculateTotalPrice = async (cart) => {
  let total = 0;
  for (const item of cart.products) {
    const product = await productModel.findById(item.product);
    if (product) {
      total += product.discountedPrice * item.quantity;
    }
  }
  cart.totalPrice = total;
};





const GetCart = async (req, res) => {
  try {
    let cart = await cartModel.findOne({ user: req.user.id }).populate("products.product");

    if (!cart) return res.status(200).json({ cart: [], finalprice: 0 });

    const finalCart = cart.products.map((item) => {
      return {
        ...item.product._doc,
        quantity: item.quantity,
      };
    });

    res.status(200).json({ cart: finalCart, finalprice: cart.totalPrice });
  } catch (error) {
    res.status(500).send(error.message);
  }
}


const AddToCart = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product || product.stock <= 0) {
      return res.status(400).send("Product not available");
    }

    let cart = await cartModel.findOne({ user: req.user.id });

    if (!cart) {
      cart = await cartModel.create({
        user: req.user.id,
        products: [{ product: product._id, quantity: 1 }],
        totalPrice: product.discountedPrice
      });
    } else {
      const index = cart.products.findIndex((p) => p.product.equals(product._id));
      if (index !== -1) {
        cart.products[index].quantity += 1;
      } else {
        cart.products.push({ product: product._id, quantity: 1 });
      }
    //   cart = await cartModel.findOne({ user: req.user.id }).populate("products.product");

      await recalculateTotalPrice(cart);
      await cart.save();
    }

    return res.status(200).json({ message: "Item added to cart" });
  } catch (error) {
    res.status(500).send(error.message);
  }
}


const RemoveItemsFromCart = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const cart = await cartModel.findOne({ user: req.user.id });
    if (!cart) return res.status(404).send("Cart is empty");

    const index = cart.products.findIndex((p) => p.product.equals(product._id));
    if (index === -1) return res.status(400).send("Item not in cart");

    // Decrease quantity and update total price
    cart.products[index].quantity -= 1;
    // cart.totalPrice = Math.max(cart.totalPrice - product.discountedPrice, 0);

    // Remove product from cart if quantity is 0 or less
    if (cart.products[index].quantity <= 0) {
      cart.products.splice(index, 1);
    }

    await recalculateTotalPrice(cart);
    await cart.save();
    return res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).send(error.message);
  }
}


const EmptyCart = async (req, res) => {
  try {
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.products = [];
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Add to your cart controller (cartCont.js)
const UpdateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;

    if (quantity < 1) return res.status(400).json({ message: "Invalid quantity" });

    const product = await productModel.findById(productId);
    if (!product) return res.status(404).send("Product not found");

    let cart = await cartModel.findOne({ user: req.user.id });
    if (!cart) return res.status(404).send("Cart not found");

    const index = cart.products.findIndex(p => p.product.equals(productId));
    if (index === -1) return res.status(404).send("Product not in cart");

    // Update quantity and totalPrice
    const oldQuantity = cart.products[index].quantity;
    cart.products[index].quantity = quantity;
    // cart.totalPrice += (quantity - oldQuantity) * product.discountedPrice;

    await recalculateTotalPrice(cart);

    await cart.save();
    return res.status(200).json({ message: "Cart updated" });
  } catch (error) {
    res.status(500).send(error.message);
  }
};



module.exports = {
    GetCart,
    AddToCart,
    RemoveItemsFromCart,
    EmptyCart,
    UpdateCartItem
}
