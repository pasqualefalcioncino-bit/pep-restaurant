const bookingModel = require("../models/booking.model");

const availableBookingTimes = [
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

const mondayIndex = 1;

const isValidBookingPayload = ({
  full_name,
  email,
  phone,
  booking_date,
  booking_time,
  guests,
}) => {
  const guestCount = Number(guests);

  return (
    full_name &&
    email &&
    phone &&
    booking_date &&
    booking_time &&
    typeof booking_time === "string" &&
    availableBookingTimes.includes(booking_time.slice(0, 5)) &&
    Number.isInteger(guestCount) &&
    guestCount > 0 &&
    guestCount <= 12
  );
};

const isClosedBookingDate = (bookingDate) => {
  return new Date(`${bookingDate}T00:00:00`).getDay() === mondayIndex;
};

const isFutureBookingDateTime = (bookingDate, bookingTime) => {
  return new Date(`${bookingDate}T${bookingTime}`) > new Date();
};

const bookingFailureMessages = {
  create: {
    NO_TABLE_AVAILABLE:
      "Impossibile prenotare: nessun tavolo disponibile per il numero di persone indicato",
  },
  update: {
    NO_TABLE_AVAILABLE:
      "Impossibile modificare: nessun tavolo disponibile per il numero di persone indicato",
  },
};

const sendBookingFailure = (res, action, reason) => {
  const message = bookingFailureMessages[action]?.[reason];

  if (!message) {
    return false;
  }

  res.status(409).send(message);
  return true;
};

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

  if (
    !isValidBookingPayload({
      full_name,
      email,
      phone,
      booking_date,
      booking_time,
      guests: Number(guests),
    })
  ) {
    return res.status(400).send("Dati prenotazione non validi");
  }

  if (!isFutureBookingDateTime(booking_date, booking_time)) {
    return res
      .status(400)
      .send("Impossibile prenotare: data e orario selezionati sono gia' passati");
  }

  if (isClosedBookingDate(booking_date)) {
    return res.status(400).send("Impossibile prenotare: il lunedi siamo chiusi");
  }

  try {
    const result = await bookingModel.createBooking({
      user_id: req.user.id,
      full_name,
      email,
      phone,
      booking_date,
      booking_time,
      guests: Number(guests),
      occasion,
      special_requests,
    });

    if (sendBookingFailure(res, "create", result.reason)) {
      return;
    }

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

exports.updateMyBooking = async (req, res) => {
  const { id } = req.params;
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

  if (
    !isValidBookingPayload({
      full_name,
      email,
      phone,
      booking_date,
      booking_time,
      guests: Number(guests),
    })
  ) {
    return res.status(400).send("Dati prenotazione non validi");
  }

  if (!isFutureBookingDateTime(booking_date, booking_time)) {
    return res
      .status(400)
      .send("Impossibile modificare: data e orario selezionati sono gia' passati");
  }

  if (isClosedBookingDate(booking_date)) {
    return res.status(400).send("Impossibile modificare: il lunedi siamo chiusi");
  }

  try {
    const result = await bookingModel.updateCustomerBooking(id, req.user.id, {
      full_name,
      email,
      phone,
      booking_date,
      booking_time,
      guests: Number(guests),
      occasion,
      special_requests,
    });

    if (sendBookingFailure(res, "update", result.reason)) {
      return;
    }

    if (result.rows.length === 0) {
      return res
        .status(403)
        .send("La prenotazione non puo' essere modificata");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore modifica prenotazione");
  }
};

exports.cancelMyBooking = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await bookingModel.cancelCustomerBooking(id, req.user.id);

    if (result.rows.length === 0) {
      return res
        .status(403)
        .send("La prenotazione non puo' essere annullata");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Errore annullamento prenotazione");
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

    if (result.reason === "TABLE_REQUIRED") {
      return res.status(400).send("Assegna un tavolo per confermare la prenotazione");
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
