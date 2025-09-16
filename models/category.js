const mongoose = require("mongoose");

// Category Schema with Mongoose Validation
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        minlength: [3, "Category name must be at least 3 characters long"],
        maxlength: [50, "Category name cannot exceed 50 characters"],
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
},
{timestamps: true}
);

categorySchema.pre("save", function (next) {
    if (!this.slug) {
      this.slug = slugify(this.name, { lower: true });
    }
    next();
});

const categoryModel = mongoose.model("category", categorySchema);


module.exports = categoryModel;
