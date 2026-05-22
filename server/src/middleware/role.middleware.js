const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).send("Non autenticato");
    }

    const allowedRoles = Array.isArray(role) ? role : [role];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).send("Accesso negato");
    }

    next();
  };
};

module.exports = checkRole;
