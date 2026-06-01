const orderModel = require("../models/order.model");

// crea ordine
exports.createOrder = async (req, res) => {
  const { table_number, items } = req.body;
  const tableNumber = Number(table_number);

  if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
    return res.status(400).send("Numero tavolo non valido");
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send("Aggiungi almeno un piatto all'ordine");
  }

  const hasInvalidItems = items.some((item) => {
    return !item.item_name || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0;
  });

  if (hasInvalidItems) {
    return res.status(400).send("Uno o piu' piatti dell'ordine non sono validi");
  }

  try {
    const result = await orderModel.createOrder(tableNumber, "in_attesa", items);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore creazione ordine");
  }
};

// lista ordini
exports.getOrders = async (req, res) => {
  try {
    const result = await orderModel.getAllOrders();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Errore recupero ordini");
  }
};

// aggiorna stato
exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = [
    "in_attesa",
    "in_preparazione",
    "pronto",
    "servito",
    "annullato"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).send("Stato ordine non valido");
  }

  try {
    const result = await orderModel.updateStatus(id, status);

    if (result.rows.length === 0) {
      return res.status(404).send("Ordine non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore aggiornamento");
  }
};

exports.markItemReady = async (req, res) => {
  const { orderId, itemId } = req.params;

  try {
    const result = await orderModel.markOrderItemReady(orderId, itemId);

    if (result.reason === "ORDER_NOT_MARKABLE") {
      return res
        .status(409)
        .send("Puoi segnare le portate pronte solo su ordini in attesa o in preparazione");
    }

    if (result.rows.length === 0) {
      return res.status(404).send("Ordine o portata non trovati");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore aggiornamento portata");
  }
};

exports.deleteOrders = async (req, res) => {
  const { status, date } = req.query;
  const allowedStatuses = ["servito", "annullato"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).send("Puoi eliminare solo ordini serviti o annullati");
  }

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).send("Data non valida");
  }

  try {
    const result = await orderModel.deleteOrdersByStatusAndDate(status, date);
    res.json({ deletedCount: result.rows.length });
  } catch (err) {
    res.status(500).send("Errore eliminazione ordini");
  }
};
