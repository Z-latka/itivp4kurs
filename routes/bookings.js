const express = require("express");
const router = express.Router();
const { Booking, Consultation, User } = require("../models");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const FORMATS = ["chat", "video", "audio"];
const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

router.use(authenticateToken);

// Запись на консультацию
router.post("/", async (req, res, next) => {
  try {
    const { consultationId, scheduledAt, format, comment } = req.body;
    const consultation = await Consultation.findByPk(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Консультация не найдена" });
    }
    if (consultation.status === "busy" || consultation.status === "completed") {
      return res
        .status(400)
        .json({ message: "Запись на эту консультацию сейчас недоступна" });
    }

    const date = new Date(scheduledAt);
    if (!scheduledAt || Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: "Укажите дату и время" });
    }
    if (date.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "Нельзя записаться на прошедшее время" });
    }
    if (format && !FORMATS.includes(format)) {
      return res.status(400).json({ message: "Недопустимый формат связи" });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      consultationId: consultation.id,
      scheduledAt: date,
      format: format || "chat",
      comment: (comment || "").trim(),
    });
    res.status(201).json({ ...booking.toJSON(), consultation });
  } catch (err) {
    next(err);
  }
});

// Мои записи
router.get("/my", async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [{ model: Consultation, as: "consultation" }],
      order: [["scheduledAt", "DESC"]],
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// Отмена своей записи
router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking || (booking.userId !== req.user.id && req.user.role !== "admin")) {
      return res.status(404).json({ message: "Запись не найдена" });
    }
    if (booking.status === "completed") {
      return res
        .status(400)
        .json({ message: "Завершённую консультацию нельзя отменить" });
    }
    await booking.update({ status: "cancelled" });
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Все записи (для психолога/администратора)
router.get("/", isAdmin, async (req, res, next) => {
  try {
    const bookings = await Booking.findAll({
      include: [
        { model: Consultation, as: "consultation" },
        // Психолог видит только псевдоним — анонимность клиента сохраняется
        { model: User, as: "user", attributes: ["id", "nickname"] },
      ],
      order: [["scheduledAt", "ASC"]],
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", isAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "Недопустимый статус" });
    }
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Запись не найдена" });
    }
    await booking.update({ status });
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
