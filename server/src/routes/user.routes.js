const express = require("express");
const router = express.Router();

const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

const verifyToken = require("../middleware/auth.middleware");
const checkRole = require("../middleware/role.middleware");

// 🔐 SOLO ADMIN
router.post("/", verifyToken, checkRole("admin"), async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await userModel.createUser(
      name,
      email,
      hashed,
      role || "cliente"
    );

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).send("Errore creazione utente");
  }
});

module.exports = router;