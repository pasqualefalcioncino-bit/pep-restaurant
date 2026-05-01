const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Il server di PepRestaurant e' in Running");
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server avviato su porta ${PORT}`);
});