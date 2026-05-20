const pool = require("../config/db");

const getAllMenu = async () => {
  return await pool.query("SELECT * FROM menu_items");
};

const createMenuItem = async (name, price, category) => {
  return await pool.query(
    "INSERT INTO menu_items (name, price, category) VALUES ($1,$2,$3) RETURNING *",
    [name, price, category]
  );
};

module.exports = {
  getAllMenu,
  createMenuItem,
};