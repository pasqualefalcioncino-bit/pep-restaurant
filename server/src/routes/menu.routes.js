const express = require("express");
const router = express.Router();

const menuController = require("../controllers/menu.controller");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

// pubblico
router.get("/", menuController.getMenu);

// solo ADMIN
router.post(
  "/",
  verifyToken,
  checkRole("admin"),
  menuController.createMenu
);

router.put(
  "/:id",
  verifyToken,
  checkRole("admin"),
  menuController.updateMenu
);

router.delete(
  "/:id",
  verifyToken,
  checkRole("admin"),
  menuController.deleteMenu
);

module.exports = router;
