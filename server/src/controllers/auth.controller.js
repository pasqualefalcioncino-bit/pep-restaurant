const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

const SECRET = process.env.JWT_SECRET;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!SECRET) {
  throw new Error("JWT_SECRET mancante nel file .env");
}

const normalizeUserPayload = ({ name, email, password }) => {
  const normalizedName = name?.trim();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    return { error: "Nome, email e password sono obbligatori" };
  }

  if (!emailPattern.test(normalizedEmail)) {
    return { error: "Email non valida" };
  }

  if (String(password).length < 6) {
    return { error: "La password deve contenere almeno 6 caratteri" };
  }

  return {
    name: normalizedName,
    email: normalizedEmail,
    password,
  };
};

const sendDuplicateEmailError = (err, res, fallbackMessage) => {
  if (err.code === "23505") {
    res.status(409).send("Email gia' in uso");
    return true;
  }

  res.status(500).send(fallbackMessage);
  return true;
};

exports.register = async (req, res) => {
  const payload = normalizeUserPayload(req.body);

  if (payload.error) {
    return res.status(400).send(payload.error);
  }

  try {
    const hashed = await bcrypt.hash(payload.password, 10);

    const result = await userModel.createUser(payload.name, payload.email, hashed, "cliente");

    const user = result.rows[0];

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      role: user.role
    });
  } catch (err) {
    sendDuplicateEmailError(err, res, "Errore registrazione");
  }
};

exports.createEmployee = async (req, res) => {
  const { role } = req.body;
  const payload = normalizeUserPayload(req.body);
  const allowedRoles = ["cuoco", "cameriere", "admin"];

  if (payload.error) {
    return res.status(400).send(payload.error);
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).send("Ruolo dipendente non valido");
  }

  try {
    const hashed = await bcrypt.hash(payload.password, 10);
    const result = await userModel.createUser(payload.name, payload.email, hashed, role);
    const user = result.rows[0];

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      role: user.role
    });
  } catch (err) {
    sendDuplicateEmailError(err, res, "Errore creazione dipendente");
  }
};

exports.login = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email e password sono obbligatorie");
  }

  try {
    const result = await userModel.findByEmail(email);

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
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).send("Errore login");
  }
};