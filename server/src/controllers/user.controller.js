const bcrypt = require("bcrypt");
const userModel = require("../models/user.model");

exports.getCurrentUser = async (req, res) => {
  try {
    const result = await userModel.findById(req.user.id);

    if (result.rows.length === 0) {
      return res.status(404).send("Utente non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore recupero utente");
  }
};

exports.getStaffUsers = async (req, res) => {
  try {
    const result = await userModel.getStaffUsers();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Errore recupero staff");
  }
};

exports.getCustomerUsers = async (req, res) => {
  try {
    const result = await userModel.getCustomerUsers();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Errore recupero clienti");
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id) {
    return res.status(400).send("Non puoi eliminare la tua utenza");
  }

  try {
    const result = await userModel.deleteUser(id);

    if (result.rows.length === 0) {
      return res.status(404).send("Utenza non trovata");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore eliminazione utenza");
  }
};

exports.createUser = async (req, res) => {
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
};
