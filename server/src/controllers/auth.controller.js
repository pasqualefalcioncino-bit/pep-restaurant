const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

const SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await userModel.createUser(name, email, hashed, "cliente");

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).send("Errore registrazione");
  }
};

exports.createEmployee = async (req, res) => {
  const { name, email, password, role } = req.body;
  const allowedRoles = ["cuoco", "admin"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).send("Ruolo dipendente non valido");
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await userModel.createUser(name, email, hashed, role);
    const user = result.rows[0];

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    res.status(500).send("Errore creazione dipendente");
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await userModel.findByEmail(email);

    console.log("EMAIL:", email);
    console.log("RESULT:", result.rows);

    if (result.rows.length === 0)
      return res.status(401).send("Utente non trovato");

    const user = result.rows[0];

    const check = await bcrypt.compare(password, user.password);

    if (!check)
      return res.status(401).send("Password errata");

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).send("Errore login");
  }
};
