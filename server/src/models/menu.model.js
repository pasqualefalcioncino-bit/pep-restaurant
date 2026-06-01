const pool = require("../config/db");

const getAllMenu = async () => {
  return await pool.query("SELECT * FROM menu_items ORDER BY category, name");
};

const createMenuItem = async ({
  name,
  description,
  price,
  category,
  prep_time,
  image,
  veg,
  available = true,
}) => {
  return await pool.query(
    `INSERT INTO menu_items
      (name, description, price, category, prep_time, image, veg, available)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [name, description, price, category, prep_time, image, veg, available]
  );
};

const updateMenuItem = async (id, {
  name,
  description,
  price,
  category,
  prep_time,
  image,
  veg,
  available = true,
}) => {
  return await pool.query(
    `UPDATE menu_items
     SET
      name=$1,
      description=$2,
      price=$3,
      category=$4,
      prep_time=$5,
      image=$6,
      veg=$7,
      available=$8
     WHERE id=$9
     RETURNING *`,
    [name, description, price, category, prep_time, image, veg, available, id]
  );
};

const updateMenuAvailability = async (id, available) => {
  return await pool.query(
    "UPDATE menu_items SET available=$1 WHERE id=$2 RETURNING *",
    [available, id]
  );
};

const deleteMenuItem = async (id) => {
  return await pool.query(
    "DELETE FROM menu_items WHERE id=$1 RETURNING *",
    [id]
  );
};

module.exports = {
  getAllMenu,
  createMenuItem,
  updateMenuItem,
  updateMenuAvailability,
  deleteMenuItem,
};
