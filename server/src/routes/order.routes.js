const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

// TUTTE PROTETTE
router.post("/", verifyToken, checkRole(["admin", "cameriere"]), orderController.createOrder);
router.get("/", verifyToken, checkRole(["admin", "cuoco", "cameriere"]), orderController.getOrders);
router.put("/:id", verifyToken, checkRole(["admin", "cuoco"]), orderController.updateStatus);

module.exports = router;
