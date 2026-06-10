const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const tableModel = require("./models/table.model");

const app = express();
const TABLE_STATUS_SYNC_INTERVAL_MS = 60 * 1000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ROUTES
const menuRoutes = require("./routes/menu.routes");
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const userRoutes = require("./routes/user.routes");
const bookingRoutes = require("./routes/booking.routes");
const tableRoutes = require("./routes/table.routes");
const inventoryRoutes = require("./routes/inventory.routes");

app.use("/menu", menuRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);
app.use("/bookings", bookingRoutes);
app.use("/tables", tableRoutes);
app.use("/inventory", inventoryRoutes);

// DATABASE CONNECTION
pool.connect()
  .then(async (client) => {
    try {
      await client.query(
        "ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS available BOOLEAN DEFAULT true"
      );
      await client.query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)"
      );
      await client.query(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT"
      );
      await client.query(
        "ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS occupied_until TIMESTAMPTZ"
      );
      console.log("Database collegato con successo --OK--");
      await tableModel.runTableStatusSync();
    } finally {
      client.release();
    }
  })
  .catch(err => console.error("Errore DB", err));

setInterval(() => {
  tableModel.runTableStatusSync().catch((err) => {
    console.error("Errore sync stato tavoli", err);
  });
}, TABLE_STATUS_SYNC_INTERVAL_MS);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Il server di PepRestaurant è in running --OK--");
});

// START SERVER
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server avviato su porta ${PORT}`);
});
