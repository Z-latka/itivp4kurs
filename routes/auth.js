const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });

router.post("/register", async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email и пароль обязательны" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Некорректный email" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Пароль должен содержать минимум 6 символов" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Роль при регистрации всегда "user": администраторы создаются сидером,
    // иначе любой мог бы назначить себе права психолога
    const newUser = await User.create({
      email,
      passwordHash,
      nickname: (nickname || "").trim() || `Аноним-${Date.now() % 10000}`,
      role: "user",
    });

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      token: signToken(newUser),
      user: newUser.toPublic(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email и пароль обязательны" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    res.json({
      token: signToken(user),
      user: user.toPublic(),
      message: "Успешный вход",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(user.toPublic());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    const { nickname, currentPassword, newPassword } = req.body;

    if (nickname !== undefined) {
      if (!nickname.trim()) {
        return res.status(400).json({ message: "Псевдоним не может быть пустым" });
      }
      user.nickname = nickname.trim();
    }

    if (newPassword) {
      const valid = await bcrypt.compare(currentPassword || "", user.passwordHash);
      if (!valid) {
        return res.status(400).json({ message: "Текущий пароль указан неверно" });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "Пароль должен содержать минимум 6 символов" });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await user.save();
    res.json(user.toPublic());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
