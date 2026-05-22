const pool = require("../config/db");

const getAllMenu = async () => {
  return await pool.query("SELECT * FROM menu_items");
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

module.exports = {
  getAllMenu,
  createMenuItem,
};

