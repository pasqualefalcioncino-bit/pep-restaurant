const menuModel = require("../models/menu.model");

const validateMenuPayload = ({ name, price, category }) => {
  if (!name || !category) {
    return "Nome e categoria sono obbligatori";
  }

  if (Number.isNaN(Number(price)) || Number(price) <= 0) {
    return "Prezzo non valido";
  }

  return "";
};

const getMenu = async (req, res) => {
  try {
    const result = await menuModel.getAllMenu();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore server");
  }
};

const createMenu = async (req, res) => {
  const { name, description, price, category, prep_time, image, veg, available } = req.body;
  const validationError = validateMenuPayload({ name, price, category });

  if (validationError) {
    return res.status(400).send(validationError);
  }

  try {
    const result = await menuModel.createMenuItem({
      name,
      description,
      price: Number(price),
      category,
      prep_time: Number(prep_time) || 0,
      image,
      veg: Boolean(veg),
      available: available !== false,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore inserimento");
  }
};

const updateMenu = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category, prep_time, image, veg, available } = req.body;
  const validationError = validateMenuPayload({ name, price, category });

  if (validationError) {
    return res.status(400).send(validationError);
  }

  try {
    const result = await menuModel.updateMenuItem(id, {
      name,
      description,
      price: Number(price),
      category,
      prep_time: Number(prep_time) || 0,
      image,
      veg: Boolean(veg),
      available: available !== false,
    });

    if (result.rows.length === 0) {
      return res.status(404).send("Piatto non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore aggiornamento piatto");
  }
};

const updateAvailability = async (req, res) => {
  const { id } = req.params;
  const { available } = req.body;

  if (typeof available !== "boolean") {
    return res.status(400).send("Disponibilita' non valida");
  }

  try {
    const result = await menuModel.updateMenuAvailability(id, available);

    if (result.rows.length === 0) {
      return res.status(404).send("Piatto non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore aggiornamento disponibilita'");
  }
};

const deleteMenu = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await menuModel.deleteMenuItem(id);

    if (result.rows.length === 0) {
      return res.status(404).send("Piatto non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore eliminazione piatto");
  }
};

module.exports = {
  getMenu,
  createMenu,
  updateMenu,
  updateAvailability,
  deleteMenu,
};
