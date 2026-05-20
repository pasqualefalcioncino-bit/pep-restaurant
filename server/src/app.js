const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
const menuRoutes = require("./routes/menu.routes");
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const userRoutes = require("./routes/user.routes");

app.use("/menu", menuRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/users", userRoutes);

// DATABASE CONNECTION
pool.connect()
  .then(() => console.log("Database collegato ✅"))
  .catch(err => console.error("Errore DB", err));

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Il server di PepRestaurant è in running 🍝");
});

// START SERVER
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server avviato su porta ${PORT}`);
});