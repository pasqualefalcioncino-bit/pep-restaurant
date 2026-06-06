const bookingModel = require("../models/booking.model");

exports.createBooking = async (req, res) => {
  const {
    full_name,
    email,
    phone,
    booking_date,
    booking_time,
    guests,
    occasion,
    special_requests,
  } = req.body;

  try {
    const result = await bookingModel.createBooking({
      user_id: req.user.id,
      full_name,
      email,
      phone,
      booking_date,
      booking_time,
      guests,
      occasion,
      special_requests,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore creazione prenotazione");
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const result = await bookingModel.getBookingsByUser(req.user.id);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore recupero prenotazioni cliente");
  }
};

exports.getBookings = async (req, res) => {
  try {
    const result = await bookingModel.getAllBookings();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore recupero prenotazioni");
  }
};

exports.updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status, table_number } = req.body;
  const allowedStatuses = ["in_attesa", "confermata", "annullata"];
  const tableNumber = table_number ? Number(table_number) : null;

  if (!allowedStatuses.includes(status)) {
    return res.status(400).send("Stato prenotazione non valido");
  }

  if (table_number && (!Number.isInteger(tableNumber) || tableNumber <= 0)) {
    return res.status(400).send("Numero tavolo non valido");
  }

  try {
    const result = await bookingModel.updateBookingStatus(id, status, tableNumber);

    if (result.reason === "TABLE_NOT_FOUND") {
      return res.status(404).send("Tavolo non trovato");
    }

    if (result.reason === "TABLE_NOT_AVAILABLE") {
      return res.status(409).send("Il tavolo selezionato non e' disponibile");
    }

    if (result.rows.length === 0) {
      return res.status(404).send("Prenotazione non trovata");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore aggiornamento prenotazione");
  }
};

exports.deleteBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await bookingModel.deleteBooking(id);

    if (result.rows.length === 0) {
      return res.status(404).send("Prenotazione non trovata");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore eliminazione prenotazione");
  }
};
