const pool = require("../config/db");

// creare ordine
const createOrder = (table_number, status = "in_attesa") => {
  return pool.query(
    "INSERT INTO orders (table_number, status) VALUES ($1,$2) RETURNING *",
    [table_number, status]
  );
};

// tutti ordini
const getAllOrders = () => {
  return pool.query("SELECT * FROM orders ORDER BY created_at DESC");
};

// aggiornare stato ordine
const updateStatus = (id, status) => {
  return pool.query(
    "UPDATE orders SET status=$1 WHERE id=$2 RETURNING *",
    [status, id]
  );
};

module.exports = {
  createOrder,
  getAllOrders,
  updateStatus,
};