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
    event_title,
  } = req.body;

  try {
    const result = await bookingModel.createBooking({
      full_name,
      email,
      phone,
      booking_date,
      booking_time,
      guests,
      occasion,
      special_requests,
      event_title,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore creazione prenotazione");
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
  const { status } = req.body;
  const allowedStatuses = ["in_attesa", "confermata", "annullata"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).send("Stato prenotazione non valido");
  }

  try {
    const result = await bookingModel.updateBookingStatus(id, status);

    if (result.rows.length === 0) {
      return res.status(404).send("Prenotazione non trovata");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore aggiornamento prenotazione");
  }
};
