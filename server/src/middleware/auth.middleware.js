const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader)
    return res.status(401).send("Token mancante");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    req.user = decoded; // contiene id + role

    next();
  } catch (err) {
    return res.status(403).send("Token non valido");
  }
};

module.exports = verifyToken;