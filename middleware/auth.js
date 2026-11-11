const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_12345";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Доступ запрещен. Токен отсутствует." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Недействительный или истекший токен." });
    }
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

const ROLE_NAMES = {
  user: "клиентам",
  psychologist: "психологам",
  admin: "администраторам",
};

const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    return res.status(403).json({
      message: `Доступ разрешен только ${roles.map((r) => ROLE_NAMES[r]).join(" и ")}.`,
    });
  };

const isAdmin = requireRole("admin");
const isPsychologist = requireRole("psychologist");
const isStaff = requireRole("psychologist", "admin");

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  isAdmin,
  isPsychologist,
  isStaff,
  JWT_SECRET,
};
