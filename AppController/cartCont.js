const cartModel = require("../models/cart");
const productModel = require("../models/product");

// ✅ Utility: recalculate cart total
const recalculateTotalPrice = async (cart) => {
  let total = 0;
  for (const item of cart.products) {
    const product = await productModel.findById(item.product);
    if (product) {
      total += (product.discountedPrice || product.price) * item.quantity;
    }
  }
  cart.totalPrice = total;
};

// ✅ Get user cart
const GetCart = async (req, res) => {
  try {
    let cart = await cartModel
      .findOne({ user: req.user._id })
      .populate("products.product");

    if (!cart) {
      return res.status(200).json({ cart: [], finalprice: 0 });
    }

    const finalCart = cart.products.map((item) => {
      return {
        ...item.product._doc,
        quantity: item.quantity,
      };
    });

    res.status(200).json({ cart: finalCart, finalprice: cart.totalPrice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Add product to cart
const AddToCart = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product || product.stock <= 0) {
      return res.status(400).json({ message: "Product not available" });
    }

    let cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      // create new cart
      cart = await cartModel.create({
        user: req.user._id,
        products: [{ product: product._id, quantity: 1 }],
        totalPrice: product.discountedPrice || product.price,
      });
    } else {
      // update existing cart
      const index = cart.products.findIndex((p) =>
        p.product.equals(product._id)
      );

      if (index !== -1) {
        cart.products[index].quantity += 1;
      } else {
        cart.products.push({ product: product._id, quantity: 1 });
      }

      await recalculateTotalPrice(cart);
      await cart.save();
    }

    // ✅ Populate products + category before sending response
    cart = await cartModel
      .findOne({ user: req.user._id })
      .populate({
        path: "products.product",
        populate: { path: "category", model: "category" }
      });

    const finalCart = cart.products.map((item) => ({
      ...item.product._doc,
      quantity: item.quantity,
    }));

    return res.status(200).json({
      message: "Item added to cart",
      cart: finalCart,
      finalprice: cart.totalPrice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Remove one item from cart
const RemoveItemsFromCart = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const cart = await cartModel.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart is empty" });

    const index = cart.products.findIndex((p) => p.product.equals(product._id));
    if (index === -1) return res.status(400).json({ message: "Item not in cart" });

    cart.products[index].quantity -= 1;

    if (cart.products[index].quantity <= 0) {
      cart.products.splice(index, 1);
    }

    await recalculateTotalPrice(cart);
    await cart.save();

    return res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Empty cart
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
};

// ✅ Update cart item quantity
const UpdateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.id;

    if (quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const product = await productModel.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await cartModel.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const index = cart.products.findIndex((p) => p.product.equals(productId));
    if (index === -1) return res.status(404).json({ message: "Product not in cart" });

    cart.products[index].quantity = quantity;

    await recalculateTotalPrice(cart);
    await cart.save();

    return res.status(200).json({ message: "Cart updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  GetCart,
  AddToCart,
  RemoveItemsFromCart,
  EmptyCart,
  UpdateCartItem,
};
