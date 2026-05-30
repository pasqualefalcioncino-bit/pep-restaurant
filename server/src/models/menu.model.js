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
}) => {
  return await pool.query(
    `INSERT INTO menu_items
      (name, description, price, category, prep_time, image, veg)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [name, description, price, category, prep_time, image, veg]
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
      veg=$7
     WHERE id=$8
     RETURNING *`,
    [name, description, price, category, prep_time, image, veg, id]
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
  deleteMenuItem,
};
