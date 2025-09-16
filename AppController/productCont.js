const productModel = require("../models/product");
const categoryModel = require("../models/category");
const cartModel = require("../models/cart");
const sharp = require("sharp");
const connectToDb = require("../config/db");
const jwt = require("jsonwebtoken");

/**
 * Get all products grouped by category + random products
 */
const GetProducts = async function (req, res) {
  let somethingInCart = false;
  let cart = null;
  let userId = null;

  try {
    // Aggregate products with category details
    const resultArray = await productModel.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category._id",
          category: { $first: "$category" },
          products: {
            $push: {
              _id: "$_id",
              name: "$name",
              price: "$price",
              discountedPrice: "$discountedPrice",
              stock: "$stock",
              description: "$description",
              inStock: { $gt: ["$stock", 0] },
              images: "$images",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          category: {
            _id: "$category._id",
            name: "$category.name",
            slug: "$category.slug",
          },
          products: 1,
        },
      },
    ]);

    // Fetch 20 random products
    const rnproducts = await productModel.aggregate([{ $sample: { size: 20 } }]);

    // Group products by category
    const resultObject = {};
    resultArray.forEach((item) => {
      resultObject[item.category._id] = {
        category: item.category,
        products: item.products,
      };
    });

    const finalData = { products: resultObject, rnproducts };

    // Cart check
    const token = req.cookies.token;
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      cart = await cartModel.findOne({ user: userId });
      if (cart && cart.products.length > 0) somethingInCart = true;
    }

    res.json({
      ...finalData,
      somethingInCart,
      cartCount: cart ? cart.products.length : 0,
    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Delete product by ID
 */
const DeleteProductbyID = async (req, res) => {
  try {
    const product = await productModel.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Decrement product stock (admin only)
 */
const DecProductStock = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const product = await productModel.findById(req.params.id);
      if (!product) return res.status(404).send("Product not found");

      if (product.stock > 0) {
        product.stock -= 1;
        await product.save();
        res.status(200).send("Stock reduced by 1");
      } else {
        res.status(400).send("Stock is already 0");
      }
    } else {
      res.send("You are not allowed to change the Stock of a Product");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
};

/**
 * Increment product stock
 */
const IncStockToProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    product.stock += 1;
    await product.save();

    res.status(200).send({ message: "Stock added successfully", product });
  } catch (error) {
    res.status(500).send({ message: "Error adding stock", error });
  }
};

/**
 * Set stock value for product (admin only)
 */
const SetStockToProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const { stock } = req.body;
    if (typeof stock !== "number" || stock < 0) {
      return res.status(400).send("Invalid stock value");
    }

    product.stock = stock;
    await product.save();

    res.status(200).json({ message: "Stock updated", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update product price (admin only)
 */
const UpdateProductPrice = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const { price, discountedPrice } = req.body;

    if (typeof price !== "number" || price < 0) {
      return res.status(400).send("Invalid price");
    }
    if (
      discountedPrice !== undefined &&
      (typeof discountedPrice !== "number" || discountedPrice < 0)
    ) {
      return res.status(400).send("Invalid discounted price");
    }

    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    product.price = price;
    product.discountedPrice = discountedPrice ?? product.discountedPrice;

    await product.save();

    res.status(200).json({ message: "Price updated", product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new product
 */
const CreateProducts = async (req, res) => {
  try {
    const { name, price, discountedPrice, category, stock, description } =
      req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const normalizedCategoryName = category.trim().toLowerCase();

    // Find or create category
    let existingCategory = await categoryModel.findOne({
      name: normalizedCategoryName,
    });
    if (!existingCategory) {
      const slugify = require("slugify");
      const slug = slugify(normalizedCategoryName, { lower: true });

      existingCategory = await categoryModel.create({
        name: normalizedCategoryName,
        slug: slug,
      });
    }

    // Convert and compress images
    const imageBuffers = await Promise.all(
      req.files.map((file) =>
        sharp(file.buffer).toFormat("webp", { quality: 90 }).toBuffer()
      )
    );

    // Save product
    const product = await productModel.create({
      name,
      price,
      discountedPrice,
      category: existingCategory._id,
      stock,
      description,
      images: imageBuffers,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (err) {
    console.error("Error creating product:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

/**
 * Get all products in DB with pagination
 */
const GetAllProductInDB = async (req, res) => {
  try {
    await connectToDb();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const totalProducts = await productModel.countDocuments();

    const products = await productModel
      .find(
        {},
        {
          name: 1,
          price: 1,
          discountedPrice: 1,
          category: 1,
          stock: 1,
          description: 1,
        }
      )
      .skip(skip)
      .limit(limit)
      .lean();

    const responsePayload = {
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
    };

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("❌ Error fetching products:", err.message);
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: err.message });
  }
};

/**
 * Get a product image directly from MongoDB
 */
const GetProductImage = async (req, res) => {
  try {
    const { productId, index } = req.params;
    const imageIndex = parseInt(index, 10) || 0;

    const product = await productModel.findById(productId);
    if (!product || !product.images || !product.images.length) {
      return res.status(404).send("Image not found");
    }

    const imageBuffer = product.images[imageIndex];
    if (!imageBuffer) {
      return res.status(404).send("Image not found");
    }

    res.set("Content-Type", "image/jpeg");
    res.send(imageBuffer);
  } catch (err) {
    console.error("Error sending image:", err.message);
    res.status(500).send("Server error");
  }
};

/**
 * Get products by category
 */
const GetProductsByCategory = async (req, res) => {
  const { categorySlug } = req.params;
  const { page = 1, limit = 12 } = req.query;

  try {
    const category = await categoryModel.findOne({ slug: categorySlug });
    if (!category)
      return res.status(404).json({ error: "Category not found" });

    const filter = { category: category._id };
    const totalProducts = await productModel.countDocuments(filter);
    const products = await productModel
      .find(filter)
      .populate("category", "name slug")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const response = {
      products,
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get product by ID
 */
const GetProductByID = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await productModel.findById(id).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch product", error: error.message });
  }
};

module.exports = {
  GetAllProductInDB,
  GetProductImage,
  GetProducts,
  GetProductByID,
  DeleteProductbyID,
  DecProductStock,
  IncStockToProduct,
  CreateProducts,
  UpdateProductPrice,
  SetStockToProduct,
  GetProductsByCategory,
};
