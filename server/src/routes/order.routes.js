const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");

const verifyToken = require("../middleware/auth.middleware");

// TUTTE PROTETTE
router.post("/", verifyToken, orderController.createOrder);
router.get("/", verifyToken, orderController.getOrders);
router.put("/:id", verifyToken, orderController.updateStatus);

module.exports = router;