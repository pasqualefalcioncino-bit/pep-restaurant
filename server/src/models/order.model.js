const pool = require("../config/db");

// creare ordine
const createOrder = async (table_number, status = "in_attesa", items = []) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const tableResult = await client.query(
      "SELECT id, status FROM restaurant_tables WHERE table_number=$1",
      [table_number]
    );

    if (tableResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        rows: [],
        reason: "TABLE_NOT_FOUND",
      };
    }

    if (tableResult.rows[0].status === "in_pulizia") {
      await client.query("ROLLBACK");
      return {
        rows: [],
        reason: "TABLE_NOT_AVAILABLE",
      };
    }

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

    await client.query(
      "UPDATE restaurant_tables SET status='occupato', occupied_until=NULL WHERE table_number=$1",
      [table_number]
    );

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
  const itemStatusByOrderStatus = {
    in_attesa: "pending",
    in_preparazione: "preparing",
    pronto: "ready",
    servito: "served",
    annullato: "cancelled",
  };
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE orders SET status=$1 WHERE id=$2 RETURNING id",
      [status, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    const orderResult = await client.query(
      "SELECT table_number FROM orders WHERE id=$1",
      [id]
    );
    const tableNumber = orderResult.rows[0]?.table_number;

    await client.query(
      "UPDATE order_items SET status=$1 WHERE order_id=$2",
      [itemStatusByOrderStatus[status], id]
    );

    if (tableNumber && !["servito", "annullato"].includes(status)) {
      await client.query(
        "UPDATE restaurant_tables SET status='occupato', occupied_until=NULL WHERE table_number=$1",
        [tableNumber]
      );
    }

    await client.query("COMMIT");

    return getOrderById(id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const markOrderItemReady = async (orderId, itemId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      "SELECT id, status FROM orders WHERE id=$1",
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    if (!["in_attesa", "in_preparazione"].includes(orderResult.rows[0].status)) {
      await client.query("ROLLBACK");
      return {
        rows: [],
        reason: "ORDER_NOT_MARKABLE",
      };
    }

    const itemResult = await client.query(
      `UPDATE order_items
       SET status='ready'
       WHERE id=$1 AND order_id=$2
       RETURNING id`,
      [itemId, orderId]
    );

    if (itemResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return { rows: [] };
    }

    const countResult = await client.query(
      `SELECT
        COUNT(*)::int AS total_items,
        COUNT(*) FILTER (WHERE status='ready')::int AS ready_items
       FROM order_items
       WHERE order_id=$1`,
      [orderId]
    );
    const counts = countResult.rows[0];

    if (counts.total_items > 0 && counts.total_items === counts.ready_items) {
      await client.query(
        "UPDATE orders SET status='pronto' WHERE id=$1",
        [orderId]
      );
    } else if (orderResult.rows[0].status === "in_attesa") {
      await client.query(
        "UPDATE orders SET status='in_preparazione' WHERE id=$1",
        [orderId]
      );
    }

    await client.query("COMMIT");

    return getOrderById(orderId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const deleteOrdersByStatusAndDate = async (status, date) => {
  const params = [status];
  let dateFilter = "";

  if (date) {
    params.push(date);
    dateFilter = " AND created_at::date=$2::date";
  }

  return await pool.query(
    `DELETE FROM orders
     WHERE status=$1${dateFilter}
     RETURNING id`,
    params
  );
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateStatus,
  markOrderItemReady,
  deleteOrdersByStatusAndDate,
};
