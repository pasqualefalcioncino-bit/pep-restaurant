const pool = require("../config/db");

const TABLE_TURNOVER_MINUTES = 30;
const CUSTOMER_MANAGEABLE_STATUSES = ["in_attesa", "confermata"];

const getAutomaticTable = async (client, guests, bookingDate, bookingTime, excludedBookingId = null) => {
  const result = await client.query(
    `SELECT t.table_number
     FROM restaurant_tables t
     WHERE t.seats >= $1
       AND t.status NOT IN ('occupato', 'in_pulizia')
       AND NOT EXISTS (
         SELECT 1
         FROM bookings b
         WHERE b.table_number = t.table_number
           AND b.booking_date = $2
           AND b.booking_time > ($3::time - ($5::int * INTERVAL '1 minute'))
           AND b.booking_time < ($3::time + ($5::int * INTERVAL '1 minute'))
           AND b.status <> 'annullata'
           AND ($4::int IS NULL OR b.id <> $4)
       )
     ORDER BY t.seats ASC, t.table_number ASC
     LIMIT 1
     FOR UPDATE`,
    [guests, bookingDate, bookingTime, excludedBookingId, TABLE_TURNOVER_MINUTES]
  );

  return result.rows[0]?.table_number || null;
};

const releaseTableIfUnused = async (client, tableNumber, excludedBookingId = null) => {
  if (!tableNumber) {
    return;
  }

  const result = await client.query(
    `SELECT id
     FROM bookings
     WHERE table_number=$1
       AND status <> 'annullata'
       AND (booking_date + booking_time) > CURRENT_TIMESTAMP
       AND ($2::int IS NULL OR id <> $2)
     LIMIT 1`,
    [tableNumber, excludedBookingId]
  );

  if (result.rows.length === 0) {
    await client.query(
      "UPDATE restaurant_tables SET status='libero', occupied_until=NULL WHERE table_number=$1 AND status='prenotato'",
      [tableNumber]
    );
  }
};

const createBooking = async ({
  user_id,
  full_name,
  email,
  phone,
  booking_date,
  booking_time,
  guests,
  occasion,
  special_requests,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tableNumber = await getAutomaticTable(client, guests, booking_date, booking_time);

    if (!tableNumber) {
      await client.query("ROLLBACK");
      return { rows: [], reason: "NO_TABLE_AVAILABLE" };
    }

    const result = await client.query(
      `INSERT INTO bookings
        (user_id, full_name, email, phone, booking_date, booking_time, guests, table_number, occasion, special_requests, status)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'confermata')
       RETURNING *`,
      [
        user_id,
        full_name,
        email,
        phone,
        booking_date,
        booking_time,
        guests,
        tableNumber,
        occasion,
        special_requests,
      ]
    );

    await client.query(
      "UPDATE restaurant_tables SET status='prenotato', occupied_until=NULL WHERE table_number=$1",
      [tableNumber]
    );

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getAllBookings = () => {
  return pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
};

const getBookingsByUser = (userId) => {
  return pool.query(
    `SELECT b.*
     FROM bookings b
     LEFT JOIN users u ON u.id = $1
     WHERE (b.user_id = $1 OR b.email = u.email)
       AND (b.booking_date + b.booking_time) > CURRENT_TIMESTAMP
     ORDER BY b.booking_date DESC, b.booking_time DESC, b.created_at DESC`,
    [userId]
  );
};

const updateCustomerBooking = async (
  id,
  userId,
  { full_name, email, phone, booking_date, booking_time, guests, occasion, special_requests }
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT b.*
       FROM bookings b
       JOIN users u ON u.id=$2
       WHERE b.id=$1
         AND (b.user_id=$2 OR b.email=u.email)
         AND b.status = ANY($3::text[])
         AND (b.booking_date + b.booking_time) > CURRENT_TIMESTAMP
       FOR UPDATE OF b`,
      [id, userId, CUSTOMER_MANAGEABLE_STATUSES]
    );

    const currentBooking = bookingResult.rows[0];

    if (!currentBooking) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    const tableNumber = await getAutomaticTable(
      client,
      guests,
      booking_date,
      booking_time,
      id
    );

    if (!tableNumber) {
      await client.query("ROLLBACK");
      return { rows: [], reason: "NO_TABLE_AVAILABLE" };
    }

    const result = await client.query(
      `UPDATE bookings
       SET full_name=$1,
           email=$2,
           phone=$3,
           booking_date=$4,
           booking_time=$5,
           guests=$6,
           table_number=$7,
           occasion=$8,
           special_requests=$9
       WHERE id=$10
       RETURNING *`,
      [
        full_name,
        email,
        phone,
        booking_date,
        booking_time,
        guests,
        tableNumber,
        occasion,
        special_requests,
        id,
      ]
    );

    await releaseTableIfUnused(client, currentBooking.table_number, id);

    await client.query(
      "UPDATE restaurant_tables SET status='prenotato', occupied_until=NULL WHERE table_number=$1",
      [tableNumber]
    );

    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const cancelCustomerBooking = async (id, userId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      `SELECT b.table_number
       FROM bookings b
       JOIN users u ON u.id=$2
       WHERE b.id=$1
         AND (b.user_id=$2 OR b.email=u.email)
         AND b.status = ANY($3::text[])
         AND (b.booking_date + b.booking_time) > CURRENT_TIMESTAMP
       FOR UPDATE OF b`,
      [id, userId, CUSTOMER_MANAGEABLE_STATUSES]
    );

    const currentBooking = bookingResult.rows[0];

    if (!currentBooking) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    const result = await client.query(
      `UPDATE bookings b
       SET status='annullata',
           table_number=NULL
       FROM users u
       WHERE b.id=$1
         AND u.id=$2
         AND (b.user_id=$2 OR b.email=u.email)
         AND b.status = ANY($3::text[])
         AND (b.booking_date + b.booking_time) > CURRENT_TIMESTAMP
       RETURNING b.*`,
      [id, userId, CUSTOMER_MANAGEABLE_STATUSES]
    );

    await releaseTableIfUnused(client, currentBooking.table_number, id);
    await client.query("COMMIT");

    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const updateBookingStatus = async (id, status, tableNumber = null) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const bookingResult = await client.query(
      "SELECT id, table_number, booking_date, booking_time, guests FROM bookings WHERE id=$1",
      [id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    const previousTableNumber = bookingResult.rows[0].table_number;
    const { booking_date: bookingDate, booking_time: bookingTime, guests } = bookingResult.rows[0];
    const nextTableNumber = status === "confermata" ? tableNumber : null;

    if (status === "confermata" && !nextTableNumber) {
      await client.query("ROLLBACK");
      return {
        rows: [],
        reason: "TABLE_REQUIRED",
      };
    }

    if (nextTableNumber) {
      const tableResult = await client.query(
        `SELECT id, seats, status
         FROM restaurant_tables
         WHERE table_number=$1`,
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

      if (tableResult.rows[0].seats < guests || tableStatus === "in_pulizia") {
        await client.query("ROLLBACK");
        return {
          rows: [],
          reason: "TABLE_NOT_AVAILABLE",
        };
      }

      const slotConflictResult = await client.query(
        `SELECT id
         FROM bookings
         WHERE table_number=$1
           AND booking_date=$2
           AND booking_time > ($3::time - ($5::int * INTERVAL '1 minute'))
           AND booking_time < ($3::time + ($5::int * INTERVAL '1 minute'))
           AND status <> 'annullata'
           AND id <> $4
         LIMIT 1`,
        [nextTableNumber, bookingDate, bookingTime, id, TABLE_TURNOVER_MINUTES]
      );

      if (slotConflictResult.rows.length > 0) {
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
      await releaseTableIfUnused(client, previousTableNumber, id);
    }

    if (nextTableNumber) {
      await client.query(
        "UPDATE restaurant_tables SET status='prenotato', occupied_until=NULL WHERE table_number=$1",
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
      await releaseTableIfUnused(client, deletedBooking.table_number, id);
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
  updateCustomerBooking,
  cancelCustomerBooking,
  updateBookingStatus,
  deleteBooking,
};
