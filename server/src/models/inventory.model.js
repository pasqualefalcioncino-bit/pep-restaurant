const pool = require("../config/db");

const getAllItems = () => {
  return pool.query(
    `SELECT *
     FROM inventory_items
     ORDER BY category ASC, name ASC`
  );
};

const createItem = ({ name, category, quantity, total_quantity, unit, min_quantity, notes }) => {
  return pool.query(
    `INSERT INTO inventory_items
      (name, category, quantity, total_quantity, unit, min_quantity, notes)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [name, category, quantity, total_quantity, unit, min_quantity, notes || null]
  );
};

const updateItem = (id, { name, category, quantity, total_quantity, unit, min_quantity, notes }) => {
  return pool.query(
    `UPDATE inventory_items
     SET name=$1,
         category=$2,
         quantity=$3,
         total_quantity=$4,
         unit=$5,
         min_quantity=$6,
         notes=$7,
         updated_at=CURRENT_TIMESTAMP
     WHERE id=$8
     RETURNING *`,
    [name, category, quantity, total_quantity, unit, min_quantity, notes || null, id]
  );
};

const getItemById = (id) => {
  return pool.query(
    `SELECT *
     FROM inventory_items
     WHERE id=$1`,
    [id]
  );
};

const updateItemQuantity = (id, quantity) => {
  return pool.query(
    `UPDATE inventory_items
     SET quantity=$1,
         updated_at=CURRENT_TIMESTAMP
     WHERE id=$2
     RETURNING *`,
    [quantity, id]
  );
};

const deleteItem = (id) => {
  return pool.query(
    `DELETE FROM inventory_items
     WHERE id=$1
     RETURNING id`,
    [id]
  );
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  updateItemQuantity,
  deleteItem,
};
