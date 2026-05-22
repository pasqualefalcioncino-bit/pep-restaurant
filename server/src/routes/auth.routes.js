const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

router.post("/register", authController.register);
router.post("/employees", verifyToken, checkRole("admin"), authController.createEmployee);
router.post("/login", authController.login);

module.exports = router;
