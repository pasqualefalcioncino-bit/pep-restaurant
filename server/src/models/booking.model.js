const pool = require("../config/db");

const createBooking = ({
  full_name,
  email,
  phone,
  booking_date,
  booking_time,
  guests,
  occasion,
  special_requests,
  event_title,
}) => {
  return pool.query(
    `INSERT INTO bookings
      (full_name, email, phone, booking_date, booking_time, guests, occasion, special_requests, event_title)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      full_name,
      email,
      phone,
      booking_date,
      booking_time,
      guests,
      occasion,
      special_requests,
      event_title,
    ]
  );
};

const getAllBookings = () => {
  return pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
};

const updateBookingStatus = (id, status) => {
  return pool.query(
    "UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *",
    [status, id]
  );
};

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
};
