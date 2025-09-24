require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const ENV = process.env;

// MongoDB Connection
const connectToDb = require("./config/db");

// Routes
const job = require("./config/cron");
const indexRouter = require('./routes/index');
const adminRouter = require("./routes/admin");
const productRouter = require("./routes/product");
const userRouter = require("./routes/user");
const categoriesRouter = require("./routes/category");
const cartRouter = require("./routes/cart");
// const paymentRouter = require("./routes/payment");
// const orderRouter = require("./routes/order");
const qrRouter = require("./routes/qrCode");
// const { warmUpProductCache } = require("./AppController/productCont");

if (ENV.NODE_ENV === "production") job.start();

// --- MIDDLEWARES ---

// ✅ Cookie parser FIRST
app.use(cookieParser());

// ✅ CORS
const corsOptions = {
    origin: ["http://localhost:3000","https://cart-app-navy.vercel.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// JSON & URL encoding
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Express Session (after cookieParser, before passport)
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,        // ⚠️ Set true only in production with HTTPS
        sameSite: "none",      // 'None' requires HTTPS
    },
}));

// Set EJS view engine if used
app.set("view engine", "ejs");

// Public static files (if needed)
app.use(express.static(path.join(__dirname, "public")));

// --- ROUTES ---
connectToDb();

// warmUpProductCache();
app.use("/", indexRouter);
app.use("/admin", adminRouter);
app.use("/products", productRouter);
app.use("/categories", categoriesRouter);
app.use("/users", userRouter);
app.use("/cart", cartRouter);
// app.use("/payment", paymentRouter);
// app.use("/order", orderRouter);
app.use("/qr", qrRouter);
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "Backend is alive" });
});


// --- START SERVER ---
const port = process.env.PORT || 4040;
app.listen(port, () => {
    console.log(`🚀 Server started on http://localhost:${port}`);
});
