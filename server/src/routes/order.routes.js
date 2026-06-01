const express = require("express");
const router = express.Router();

const orderController = require("../controllers/order.controller");

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

// TUTTE PROTETTE
router.post("/", verifyToken, checkRole(["admin", "cameriere"]), orderController.createOrder);
router.get("/", verifyToken, checkRole(["admin", "cuoco", "cameriere"]), orderController.getOrders);
router.delete("/", verifyToken, checkRole(["admin", "cuoco"]), orderController.deleteOrders);
router.patch(
  "/:orderId/items/:itemId/ready",
  verifyToken,
  checkRole(["admin", "cuoco"]),
  orderController.markItemReady
);
router.put("/:id", verifyToken, checkRole(["admin", "cuoco"]), orderController.updateStatus);

module.exports = router;
