const pool = require("../config/db");

const findByEmail = (email) => {
  return pool.query("SELECT * FROM users WHERE email=$1", [email]);
};

const findById = (id) => {
  return pool.query("SELECT id, name, email, role FROM users WHERE id=$1", [id]);
};

const createUser = (name, email, password, role = "cliente") => {
  return pool.query(
    "INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING *",
    [name, email, password, role]
  );
};

const getStaffUsers = () => {
  return pool.query(
    "SELECT id, name, email, role FROM users WHERE role <> $1 ORDER BY role, name",
    ["cliente"]
  );
};

const getCustomerUsers = () => {
  return pool.query(
    "SELECT id, name, email, role FROM users WHERE role = $1 ORDER BY name",
    ["cliente"]
  );
};

const deleteUser = (id) => {
  return pool.query(
    "DELETE FROM users WHERE id=$1 RETURNING id, name, email, role",
    [id]
  );
};

module.exports = {
  findByEmail,
  findById,
  createUser,
  getStaffUsers,
  getCustomerUsers,
  deleteUser,
};
