const orderModel = require("../models/order.model");

// crea ordine
exports.createOrder = async (req, res) => {
  const { table_number } = req.body;

  try {
    const result = await orderModel.createOrder(table_number);

    res.json(result.rows[0]);
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
