const pool = require("../config/db");

const BOOKING_OCCUPANCY_MINUTES = 30;

const syncReservedTableStatuses = async (client) => {
  await client.query(
    `UPDATE restaurant_tables t
     SET status='occupato',
         occupied_until=NULL
     WHERE t.status = 'prenotato'
       AND EXISTS (
         SELECT 1
         FROM bookings b
         WHERE b.table_number = t.table_number
           AND b.status <> 'annullata'
           AND CURRENT_TIMESTAMP >= (b.booking_date + b.booking_time)
           AND CURRENT_TIMESTAMP < (
             b.booking_date + b.booking_time + ($1::int * INTERVAL '1 minute')
           )
       )`,
    [BOOKING_OCCUPANCY_MINUTES]
  );

  await client.query(
    `UPDATE restaurant_tables t
     SET status='prenotato',
         occupied_until=NULL
     WHERE t.status = 'libero'
       AND NOT EXISTS (
         SELECT 1
         FROM orders o
         WHERE o.table_number = t.table_number
           AND o.status NOT IN ('servito', 'annullato')
       )
       AND NOT EXISTS (
         SELECT 1
         FROM bookings active_b
         WHERE active_b.table_number = t.table_number
           AND active_b.status <> 'annullata'
           AND CURRENT_TIMESTAMP >= (active_b.booking_date + active_b.booking_time)
           AND CURRENT_TIMESTAMP < (
             active_b.booking_date + active_b.booking_time + ($1::int * INTERVAL '1 minute')
           )
       )
       AND EXISTS (
         SELECT 1
         FROM bookings b
         WHERE b.table_number = t.table_number
           AND b.status <> 'annullata'
           AND (b.booking_date + b.booking_time) > CURRENT_TIMESTAMP
       )`,
    [BOOKING_OCCUPANCY_MINUTES]
  );

  await client.query(
    `UPDATE restaurant_tables t
     SET status='libero',
         occupied_until=NULL
     WHERE t.status = 'prenotato'
       AND NOT EXISTS (
         SELECT 1
         FROM orders o
         WHERE o.table_number = t.table_number
           AND o.status NOT IN ('servito', 'annullato')
       )
       AND NOT EXISTS (
         SELECT 1
         FROM bookings b
         WHERE b.table_number = t.table_number
           AND b.status <> 'annullata'
           AND (
             (b.booking_date + b.booking_time) > CURRENT_TIMESTAMP
             OR (
               CURRENT_TIMESTAMP >= (b.booking_date + b.booking_time)
               AND CURRENT_TIMESTAMP < (
                 b.booking_date + b.booking_time + ($1::int * INTERVAL '1 minute')
               )
             )
           )
       )`,
    [BOOKING_OCCUPANCY_MINUTES]
  );
};

const runTableStatusSync = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await syncReservedTableStatuses(client);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const getAllTables = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await syncReservedTableStatuses(client);
    const result = await client.query(
      `SELECT *
       FROM restaurant_tables
       ORDER BY table_number ASC`
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

const createTable = ({ table_number, seats, area, status, notes }) => {
  return pool.query(
    `INSERT INTO restaurant_tables
      (table_number, seats, area, status, notes)
     SELECT
      COALESCE(
        $1::int,
        (
          SELECT COALESCE(MIN(candidate_number), 1)
          FROM generate_series(
            1,
            COALESCE((SELECT MAX(table_number) + 1 FROM restaurant_tables), 1)
          ) AS candidate_number
          WHERE NOT EXISTS (
            SELECT 1
            FROM restaurant_tables
            WHERE table_number = candidate_number
          )
        )
      ),
      $2,
      $3,
      $4,
      $5
     RETURNING *`,
    [table_number, seats, area || null, status || "libero", notes || null]
  );
};

const updateTable = (id, { table_number, seats, area, status, notes }) => {
  return pool.query(
    `UPDATE restaurant_tables
     SET table_number=$1,
         seats=$2,
         area=$3,
         status=COALESCE($4, status),
         occupied_until=CASE
           WHEN $4 IN ('libero', 'prenotato', 'in_pulizia') THEN NULL
           ELSE occupied_until
         END,
         notes=$5
     WHERE id=$6
     RETURNING *`,
    [table_number, seats, area || null, status, notes || null, id]
  );
};

const updateTableStatus = (id, status) => {
  return pool.query(
    `UPDATE restaurant_tables
     SET status=$1,
         occupied_until=NULL
     WHERE id=$2
     RETURNING *`,
    [status, id]
  );
};

const seatGuestTable = async (id, guests) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await syncReservedTableStatuses(client);

    const result = await client.query(
      `UPDATE restaurant_tables
       SET status='occupato',
           occupied_until=NULL
       WHERE id=$1
         AND seats >= $2
         AND status='libero'
       RETURNING *`,
      [id, guests]
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

const deleteTable = (id) => {
  return pool.query(
    `DELETE FROM restaurant_tables
     WHERE id=$1
     RETURNING id`,
    [id]
  );
};

module.exports = {
  getAllTables,
  runTableStatusSync,
  createTable,
  updateTable,
  updateTableStatus,
  seatGuestTable,
  deleteTable,
};
