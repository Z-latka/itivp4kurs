const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Доступ запрещен. Токен отсутствует." });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "super_secret_key_12345",
    (err, user) => {
      if (err) {
        return res
          .status(403)
          .json({ message: "Недействительный или истекший токен." });
      }
      req.user = user;
      next();
    },
  );
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

module.exports = { authenticateToken, isAdmin };
