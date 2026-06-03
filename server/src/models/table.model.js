const pool = require("../config/db");

const getAllTables = () => {
  return pool.query(
    `SELECT *
     FROM restaurant_tables
     ORDER BY table_number ASC`
  );
};

const createTable = ({ table_number, seats, area, status, notes }) => {
  return pool.query(
    `INSERT INTO restaurant_tables
      (table_number, seats, area, status, notes)
     VALUES
      ($1,$2,$3,$4,$5)
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
         status=$4,
         notes=$5
     WHERE id=$6
     RETURNING *`,
    [table_number, seats, area || null, status, notes || null, id]
  );
};

const updateTableStatus = (id, status) => {
  return pool.query(
    `UPDATE restaurant_tables
     SET status=$1
     WHERE id=$2
     RETURNING *`,
    [status, id]
  );
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
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
};
