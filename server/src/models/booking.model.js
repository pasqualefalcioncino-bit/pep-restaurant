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

const updateBookingStatus = async (id, status, tableNumber = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      "SELECT id, table_number FROM bookings WHERE id=$1",
      [id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    const previousTableNumber = bookingResult.rows[0].table_number;
    const nextTableNumber = status === "confermata" ? tableNumber : null;

    if (nextTableNumber) {
      const tableResult = await client.query(
        "SELECT id, status FROM restaurant_tables WHERE table_number=$1",
        [nextTableNumber]
      );

      if (tableResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return {
          rows: [],
          reason: "TABLE_NOT_FOUND",
        };
      }

      const tableStatus = tableResult.rows[0].status;
      const isSameAssignedTable = previousTableNumber === nextTableNumber;

      if (
        tableStatus === "in_pulizia" ||
        tableStatus === "occupato" ||
        (tableStatus === "prenotato" && !isSameAssignedTable)
      ) {
        await client.query("ROLLBACK");
        return {
          rows: [],
          reason: "TABLE_NOT_AVAILABLE",
        };
      }
    }

    const result = await client.query(
      `UPDATE bookings
       SET status=$1,
           table_number=$2
       WHERE id=$3
       RETURNING *`,
      [status, nextTableNumber, id]
    );

    if (previousTableNumber && previousTableNumber !== nextTableNumber) {
      await client.query(
        "UPDATE restaurant_tables SET status='libero' WHERE table_number=$1 AND status='prenotato'",
        [previousTableNumber]
      );
    }

    if (nextTableNumber) {
      await client.query(
        "UPDATE restaurant_tables SET status='prenotato' WHERE table_number=$1",
        [nextTableNumber]
      );
    }

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const deleteBooking = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "DELETE FROM bookings WHERE id=$1 RETURNING *",
      [id]
    );

    const deletedBooking = result.rows[0];

    if (deletedBooking?.table_number) {
      await client.query(
        "UPDATE restaurant_tables SET status='libero' WHERE table_number=$1 AND status='prenotato'",
        [deletedBooking.table_number]
      );
    }

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingsByUser,
  updateBookingStatus,
  deleteBooking,
};
