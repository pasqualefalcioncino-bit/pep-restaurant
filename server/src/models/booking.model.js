const pool = require("../config/db");

const createBooking = ({
  user_id,
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
      (user_id, full_name, email, phone, booking_date, booking_time, guests, occasion, special_requests, event_title)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      user_id,
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

const getBookingsByUser = (userId) => {
  return pool.query(
    `SELECT b.*
     FROM bookings b
     LEFT JOIN users u ON u.id = $1
     WHERE b.user_id = $1 OR b.email = u.email
     ORDER BY b.booking_date DESC, b.booking_time DESC, b.created_at DESC`,
    [userId]
  );
};

const updateBookingStatus = (id, status) => {
  return pool.query(
    "UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *",
    [status, id]
  );
};

const deleteBooking = (id) => {
  return pool.query(
    "DELETE FROM bookings WHERE id=$1 RETURNING *",
    [id]
  );
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingsByUser,
  updateBookingStatus,
  deleteBooking,
};
