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
      // 401, чтобы клиент понял, что нужно войти заново
      return res
        .status(401)
        .json({ message: "Недействительный или истекший токен." });
    }
    req.user = user;
    next();
  });
};

// Не требует входа, но если токен валиден — заполняет req.user
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Доступ разрешен только администраторам." });
  }
};

module.exports = { authenticateToken, optionalAuth, isAdmin, JWT_SECRET };
