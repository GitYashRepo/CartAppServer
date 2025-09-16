    const express = require("express");
    const router = express.Router();
    const {validateAdmin} = require("../middlewares/admin");
    const { AdminLogin, CreateAdmin, GetAdminData, GetAdminTotalProducts, AdminProductSearch, AdminLogout, GetAdminHimself, getAllOrders, updateOrderStatus , getAllContacts, toggleContactRead, deleteContact } = require("../AppController/adminCont");



    router.get("/create", CreateAdmin);
    router.post("/login", AdminLogin);
    router.get("/dashboard", validateAdmin, GetAdminData);
    router.get("/products", validateAdmin, GetAdminTotalProducts);
    router.post("/products/search/:id", validateAdmin, AdminProductSearch);
    router.get("/logout",validateAdmin, AdminLogout);
    router.get('/me', validateAdmin, GetAdminHimself);
    router.get("/getallorders", validateAdmin, getAllOrders);
    router.patch('/orders/:orderId/status', updateOrderStatus);



    module.exports = router;
