const express = require("express");
const router = express.Router();

const tableController = require("../controllers/table.controller");

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

router.get("/", verifyToken, checkRole(["admin", "cameriere"]), tableController.getTables);
router.post("/", verifyToken, checkRole("admin"), tableController.createTable);
router.put("/:id", verifyToken, checkRole("admin"), tableController.updateTable);
router.patch(
  "/:id/status",
  verifyToken,
  checkRole(["admin", "cameriere"]),
  tableController.updateTableStatus
);
router.delete("/:id", verifyToken, checkRole("admin"), tableController.deleteTable);

module.exports = router;
