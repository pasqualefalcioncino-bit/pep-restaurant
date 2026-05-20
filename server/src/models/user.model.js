const pool = require("../config/db");

const findByEmail = (email) => {
  return pool.query("SELECT * FROM users WHERE email=$1", [email]);
};

const createUser = (name, email, password, role = "cliente") => {
  return pool.query(
    "INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, email, password, role]
  );
};

module.exports = {
  findByEmail,
  createUser,
};