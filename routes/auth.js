const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "12h",
  });

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, nickname, city } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email и пароль обязательны" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Пароль должен содержать минимум 6 символов" });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }

    // Роль при регистрации всегда "user": администраторы создаются скриптом seed
    const newUser = await User.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "user",
      profile: {
        nickname: (nickname || "").trim() || `Аноним-${Date.now() % 10000}`,
        city,
      },
    });

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      token: signToken(newUser),
      user: newUser.toPublic(),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email и пароль обязательны" });
    }

    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }
    if (!user.active) {
      return res
        .status(403)
        .json({ message: "Аккаунт отключён. Обратитесь к администратору сервиса." });
    }

    res.json({
      token: signToken(user),
      user: user.toPublic(),
      message: "Успешный вход",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/profile", authenticateToken, async (req, res, next) => {
  try {
    // Проекция: историю тестов и дневник не загружаем
    const user = await User.findById(req.user.id).select("-testResults -moods");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(user.toPublic());
  } catch (err) {
    next(err);
  }
});

router.put("/profile", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-testResults -moods");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    const { nickname, city, about, currentPassword, newPassword } = req.body;

    if (nickname !== undefined) {
      if (!nickname.trim()) {
        return res.status(400).json({ message: "Псевдоним не может быть пустым" });
      }
      // Обновление поля вложенного документа
      user.profile.nickname = nickname.trim();
    }
    if (city !== undefined) user.profile.city = city;
    if (about !== undefined) user.profile.about = about;

    // Психолог сам редактирует свою публичную анкету (кроме имени — его меняет администратор)
    if (user.role === "psychologist" && req.body.specialist) {
      ["title", "experienceYears", "education", "approach", "about", "topics"].forEach((field) => {
        if (req.body.specialist[field] !== undefined) {
          user.specialist[field] = req.body.specialist[field];
        }
      });
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
  } catch (err) {
    next(err);
  }
});

module.exports = router;
