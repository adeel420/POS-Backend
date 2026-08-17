const requireAdmin = (req, res, next) => {
  if (![ "admin", "superadmin"].includes(req.user?.role)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Superadmin access required" });
  }
  next();
};

module.exports = { requireAdmin, requireSuperAdmin };
