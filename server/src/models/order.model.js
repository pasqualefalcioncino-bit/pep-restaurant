const pool = require("../config/db");

// creare ordine
const createOrder = async (table_number, status = "in_attesa", items = []) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      "INSERT INTO orders (table_number, status) VALUES ($1,$2) RETURNING *",
      [table_number, status]
    );
    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
          (order_id, menu_item_id, item_name, category, quantity, notes)
         VALUES
          ($1,$2,$3,$4,$5,$6)`,
        [
          order.id,
          item.menu_item_id || null,
          item.item_name,
          item.category || null,
          item.quantity || 1,
          item.notes || null,
        ]
      );
    }

    await client.query("COMMIT");

    return getOrderById(order.id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// tutti ordini
const getAllOrders = () => {
  return pool.query(
    `SELECT
      o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'item_name', oi.item_name,
            'category', oi.category,
            'quantity', oi.quantity,
            'notes', oi.notes,
            'status', oi.status
          )
          ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id
     ORDER BY o.created_at DESC`
  );
};

const getOrderById = (id) => {
  return pool.query(
    `SELECT
      o.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi.id,
            'menu_item_id', oi.menu_item_id,
            'item_name', oi.item_name,
            'category', oi.category,
            'quantity', oi.quantity,
            'notes', oi.notes,
            'status', oi.status
          )
          ORDER BY oi.id
        ) FILTER (WHERE oi.id IS NOT NULL),
        '[]'
      ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id=$1
     GROUP BY o.id`,
    [id]
  );
};

// aggiornare stato ordine
const updateStatus = async (id, status) => {
  const result = await pool.query(
    "UPDATE orders SET status=$1 WHERE id=$2 RETURNING id",
    [status, id]
  );

  if (result.rows.length === 0) {
    return { rows: [] };
  }

  return getOrderById(id);
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateStatus,
};
