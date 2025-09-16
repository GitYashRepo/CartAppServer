require("dotenv").config();
const adminModel = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const productModel = require("../models/product");
const categoryModel = require("../models/category");
const orderModel = require("../models/order");

const CreateAdmin = async function( req, res ){
    try{
        let hash = await bcrypt.hash("cartapp", 10);
        let admin = new adminModel({
            name:"Cart App",
            email:"singhyash@gmail.com",
            password: hash,
            role: "admin",
        });
        await admin.save();

        let token = jwt.sign({email: admin.email, role: "admin"}, process.env.JWT_SECRET);
        res.cookie("admintoken", token);
        res.send("admin recreated successfully");
    }catch(err){
        res.send(err.message);
    }
}


const AdminLogin = async function(req,res){
    let {email, password} = req.body;

    let admin = await adminModel.findOne({email});
    if(!admin){
        return res.send("This admin not available");
    }

    let valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
        { _id: admin._id, email: admin.email, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("admintoken", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true
    });

    res.status(200).json({
      message: "Admin logged in successfully",
      token,
      user: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
}

const GetAdminHimself = async (req, res) => {
  try {
    const admin = await adminModel.findById(req.user._id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json({ user: admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

const GetAdminData = async function(req,res){
    let prodcount = await productModel.countDocuments();
    let categcount = await categoryModel.countDocuments();
    let ordercount = await orderModel.countDocuments();
    const categories = await categoryModel.find({}, 'name');
    const orders = await orderModel
        .find({})
        .populate("user", "email") // populate user's email
        .populate("products", "name price") // populate product names
        .populate("payment", "paymentId")
        .sort({ createdAt: -1 });

    res.status(200).json({ prodcount , categcount, ordercount , categories, orders });
}

const GetAdminTotalProducts = async function(req,res){
    const resultArray = await productModel.aggregate([
        {
            $group:{
                _id: "$category",
                products: {$push:"$$ROOT"}
            }
        },
        {
            $project: {
                _id: 0,
                category: "$_id",
                products: { $slice: ["$products", 10]}
            }
        }
    ]);

    const resultObject = resultArray.reduce((acc,item)=>{
        acc[item.category] = item.products;
        return acc;
    },{});
    res.status(200).json({ products: resultObject });
}

const AdminProductSearch = async function(req,res){
    try {
        if(req.user.admin){
            await productModel.findOne({_id: req.body.product_id});
            return res.render("admin_products");
        }
        res.send("You are not allowed to delete this products");
    } catch (error) {
        res.send(error.message);
    }
}

const AdminLogout = function(req,res){
    res.clearCookie("token");
    res.status(200).json({ message: "Admin logged out successfully" });
}

// controllers/adminController.js
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("user", "name email") // Assuming user model has name/email
      .populate("products.product", "name price discountedPrice")
      .populate("payment")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ getAllOrders error:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!["order placed", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await orderModel.findOneAndUpdate(
      { orderId },
      { status },
      { new: true }
    ).populate("products.product").populate("address");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


module.exports = {
    CreateAdmin,
    AdminLogin,
    GetAdminData,
    GetAdminTotalProducts,
    AdminProductSearch,
    AdminLogout,
    GetAdminHimself,
    getAllOrders,
    updateOrderStatus,
}
