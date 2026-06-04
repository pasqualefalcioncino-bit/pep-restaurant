const inventoryModel = require("../models/inventory.model");

const allowedUnits = ["kg", "g", "l", "ml", "pz", "bottiglie", "vasetti"];

const normalizeInventoryPayload = (body) => {
  const name = body.name?.trim();
  const category = body.category?.trim();
  const unit = body.unit;
  const quantity = Number(body.quantity);
  const totalQuantity = Number(body.total_quantity);

  if (!name || !category) {
    return { error: "Nome e categoria sono obbligatori" };
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    return { error: "Quantita' non valida" };
  }

  if (!Number.isFinite(totalQuantity) || totalQuantity <= 0) {
    return { error: "Totale scorta non valido" };
  }

  if (quantity > totalQuantity) {
    return { error: "La quantita' attuale non puo' superare il totale scorta" };
  }

  if (!allowedUnits.includes(unit)) {
    return { error: "Unita' di misura non valida" };
  }

  return {
    name,
    category,
    quantity,
    total_quantity: totalQuantity,
    unit,
    min_quantity: totalQuantity / 3,
    notes: body.notes?.trim() || null,
  };
};

exports.getItems = async (req, res) => {
  try {
    const result = await inventoryModel.getAllItems();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Errore recupero inventario");
  }
};

exports.createItem = async (req, res) => {
  const payload = normalizeInventoryPayload(req.body);

  if (payload.error) {
    return res.status(400).send(payload.error);
  }

  try {
    const result = await inventoryModel.createItem(payload);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore creazione ingrediente");
  }
};

exports.updateItem = async (req, res) => {
  const { id } = req.params;
  const payload = normalizeInventoryPayload(req.body);

  if (payload.error) {
    return res.status(400).send(payload.error);
  }

  try {
    const result = await inventoryModel.updateItem(id, payload);

    if (result.rows.length === 0) {
      return res.status(404).send("Ingrediente non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore aggiornamento ingrediente");
  }
};

exports.updateItemQuantity = async (req, res) => {
  const { id } = req.params;
  const quantity = Number(req.body.quantity);

  if (!Number.isFinite(quantity) || quantity < 0) {
    return res.status(400).send("Quantita' non valida");
  }

  try {
    const itemResult = await inventoryModel.getItemById(id);

    if (itemResult.rows.length === 0) {
      return res.status(404).send("Ingrediente non trovato");
    }

    if (quantity > Number(itemResult.rows[0].total_quantity)) {
      return res.status(400).send("La quantita' attuale non puo' superare il totale scorta");
    }

    const result = await inventoryModel.updateItemQuantity(id, quantity);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore aggiornamento scorta");
  }
};

exports.deleteItem = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await inventoryModel.deleteItem(id);

    if (result.rows.length === 0) {
      return res.status(404).send("Ingrediente non trovato");
    }

    res.json({ deletedId: result.rows[0].id });
  } catch (err) {
    res.status(500).send("Errore eliminazione ingrediente");
  }
};
