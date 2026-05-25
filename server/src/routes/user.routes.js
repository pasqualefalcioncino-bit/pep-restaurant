const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

router.get("/me", verifyToken, userController.getCurrentUser);
router.get("/staff", verifyToken, checkRole("admin"), userController.getStaffUsers);
router.get("/customers", verifyToken, checkRole("admin"), userController.getCustomerUsers);
router.delete("/:id", verifyToken, checkRole("admin"), userController.deleteUser);

// SOLO ADMIN
router.post("/", verifyToken, checkRole("admin"), userController.createUser);

module.exports = router;
