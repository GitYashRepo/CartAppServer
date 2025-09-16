const express = require("express");
const router = express.Router();
const upload = require("../config/multer_config")
const {validateAdmin, userIsLoggedIn} = require("../middlewares/admin");
const { GetProducts, DeleteProductbyID, DecProductStock, IncStockToProduct, CreateProducts, SetStockToProduct, UpdateProductPrice, GetAllProductInDB, GetProductImage, GetProductsByCategory, GetProductByID } = require("../AppController/productCont");


router.get("/getproducts",userIsLoggedIn, GetProducts);
router.get("/getallproductsindb", GetAllProductInDB);
router.get("/product/:id", GetProductByID);
router.get("/image/:productId/:index", GetProductImage);
router.get("/category/:categorySlug", GetProductsByCategory);
router.delete("/product/:id", validateAdmin, DeleteProductbyID);
router.patch("/reduce-stock/:id", validateAdmin, DecProductStock);
router.patch("/add-stock/:productId",validateAdmin, IncStockToProduct);
router.patch("/set-stock/:id", validateAdmin, SetStockToProduct);
router.patch("/update-price/:id", validateAdmin, UpdateProductPrice);
router.post("/createproducts", upload.array("images", 5), CreateProducts);

module.exports = router;
