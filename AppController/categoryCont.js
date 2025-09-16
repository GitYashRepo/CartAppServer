const categoryModel = require("../models/category");
const productModel = require("../models/product");
const slugify = require("slugify");

// ✅ Create Category
const CreateCategory = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedName = name.toLowerCase();
    const slug = slugify(normalizedName, { lower: true });

    // Check if category already exists
    const existing = await categoryModel.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await categoryModel.create({
      name: normalizedName,
      slug,
    });

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Error creating category:", error.message);
    res.status(500).json({ message: "Failed to create category" });
  }
};

// ✅ Get Categories
const GetCategory = async (req, res) => {
  try {
    const categories = await categoryModel.find({}, "_id name").lean();
    res.json({ categories });
  } catch (error) {
    console.error("❌ Error fetching categories:", error.message);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

// ✅ Delete Category
const DeleteCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not allowed to delete this Category" });
    }

    const categoryName = req.body.category_name?.trim();
    if (!categoryName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await categoryModel.findOne({
      name: new RegExp(`^${categoryName}$`, "i"),
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if products exist in this category
    const products = await productModel.find({ category: category._id });
    if (products.length > 0) {
      return res.status(400).json({
        message: "Cannot delete category as it has products associated with it.",
      });
    }

    await categoryModel.findByIdAndDelete(category._id);
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting category:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  CreateCategory,
  GetCategory,
  DeleteCategory,
};
