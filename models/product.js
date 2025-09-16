const mongoose = require("mongoose");

// Product Schema with Mongoose Validation
const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        minlength: [3, "Product name must be at least 3 characters long"],
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, "Price cannot be negative"],
    },
    discountedPrice:{
        type: Number,
        min: [0, "Price cannot be negative"],
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: [true, "Product category is required"],
    },
    stock: {
        type: Number,
        required: [true, "Stock status is required"],
    },
    description: {
        type: String,
    },
    images: {
        type: [Buffer],
        validate: [
            arr => Array.isArray(arr) && arr.length >= 1 && arr.length <= 5,
            "You must upload between 1 and 5 images"
        ],
        required: [true, "At least one product image is required"]
    },
}, { timestamps: true });
const productModel = mongoose.model("product", productSchema);


module.exports = productModel;
