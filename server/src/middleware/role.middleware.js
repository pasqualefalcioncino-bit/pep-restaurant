const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).send("Non autenticato");
    }

    if (req.user.role !== role) {
      return res.status(403).send("Accesso negato");
    }

    next();
  };
};

module.exports = checkRole;