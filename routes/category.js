const express = require("express");
const router = express.Router();
const {validateAdmin} = require("../middlewares/admin");
const { CreateCategory, GetCategory, DeleteCategory } = require("../AppController/categoryCont");


router.post("/create", validateAdmin, CreateCategory);
router.get("/getcateg", GetCategory);
router.post("/delete/categ", validateAdmin, DeleteCategory);


module.exports = router;
