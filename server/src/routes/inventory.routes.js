const express = require("express");
const router = express.Router();

const inventoryController = require("../controllers/inventory.controller");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

router.get("/", verifyToken, checkRole(["admin", "cuoco"]), inventoryController.getItems);
router.post("/", verifyToken, checkRole("admin"), inventoryController.createItem);
router.patch("/:id/quantity", verifyToken, checkRole(["admin", "cuoco"]), inventoryController.updateItemQuantity);
router.put("/:id", verifyToken, checkRole("admin"), inventoryController.updateItem);
router.delete("/:id", verifyToken, checkRole("admin"), inventoryController.deleteItem);

module.exports = router;
