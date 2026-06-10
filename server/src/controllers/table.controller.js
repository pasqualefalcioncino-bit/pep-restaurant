const tableModel = require("../models/table.model");

const allowedStatuses = ["libero", "occupato", "prenotato", "in_pulizia"];
const manuallyAssignableStatuses = ["libero", "in_pulizia"];

const isValidPositiveInteger = (value) => {
  return Number.isInteger(value) && value > 0;
};

const normalizeTablePayload = (
  body,
  { requireTableNumber = true, defaultStatus = "libero" } = {}
) => {
  const hasTableNumber = body.table_number !== undefined && body.table_number !== null && body.table_number !== "";
  const tableNumber = hasTableNumber ? Number(body.table_number) : null;
  const seats = Number(body.seats);
  const status = body.status || defaultStatus;

  if ((requireTableNumber || hasTableNumber) && !isValidPositiveInteger(tableNumber)) {
    return { error: "Numero tavolo non valido" };
  }

  if (!isValidPositiveInteger(seats)) {
    return { error: "Numero posti non valido" };
  }

  if (status && !allowedStatuses.includes(status)) {
    return { error: "Stato tavolo non valido" };
  }

  return {
    table_number: tableNumber,
    seats,
    area: body.area?.trim() || null,
    status,
    notes: body.notes?.trim() || null,
  };
};

exports.getTables = async (req, res) => {
  try {
    const result = await tableModel.getAllTables();
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Errore recupero tavoli");
  }
};

exports.createTable = async (req, res) => {
  const payload = normalizeTablePayload(req.body, { requireTableNumber: false });

  if (payload.error) {
    return res.status(400).send(payload.error);
  }

  try {
    const result = await tableModel.createTable(payload);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).send("Numero tavolo gia' presente");
    }

    res.status(500).send("Errore creazione tavolo");
  }
};

exports.updateTable = async (req, res) => {
  const { id } = req.params;
  const payload = normalizeTablePayload(req.body, { defaultStatus: null });

  if (payload.error) {
    return res.status(400).send(payload.error);
  }

  try {
    const result = await tableModel.updateTable(id, payload);

    if (result.rows.length === 0) {
      return res.status(404).send("Tavolo non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).send("Numero tavolo gia' presente");
    }

    res.status(500).send("Errore aggiornamento tavolo");
  }
};

exports.updateTableStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!manuallyAssignableStatuses.includes(status)) {
    return res.status(400).send("Stato tavolo non valido");
  }

  try {
    const result = await tableModel.updateTableStatus(id, status);

    if (result.rows.length === 0) {
      return res.status(404).send("Tavolo non trovato");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore aggiornamento stato tavolo");
  }
};

exports.seatGuestTable = async (req, res) => {
  const { id } = req.params;
  const guests = Number(req.body.guests);

  if (!isValidPositiveInteger(guests)) {
    return res.status(400).send("Numero coperti non valido");
  }

  try {
    const result = await tableModel.seatGuestTable(id, guests);

    if (result.rows.length === 0) {
      return res.status(409).send("Tavolo non disponibile");
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Errore assegnazione tavolo");
  }
};

exports.deleteTable = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await tableModel.deleteTable(id);

    if (result.rows.length === 0) {
      return res.status(404).send("Tavolo non trovato");
    }

    res.json({ deletedId: result.rows[0].id });
  } catch (err) {
    res.status(500).send("Errore eliminazione tavolo");
  }
};
