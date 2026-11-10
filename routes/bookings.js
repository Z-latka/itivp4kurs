const express = require("express");
const router = express.Router();
const { Booking, Consultation } = require("../models");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

router.use(authenticateToken);

// Запись на консультацию
router.post("/", async (req, res, next) => {
  try {
    const { consultationId, scheduledAt, format, comment } = req.body;
    const consultation = await Consultation.findById(consultationId).select("-reviews");
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

    const booking = await Booking.create({
      user: req.user.id,
      consultation: consultation._id,
      scheduledAt: date,
      format,
      comment,
    });
    await booking.populate("consultation", "-reviews");
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

// Мои записи: populate подставляет документ консультации вместо ObjectId
router.get("/my", async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("consultation", "-reviews")
      .sort({ scheduledAt: -1 });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// Отмена своей записи
router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (
      !booking ||
      (String(booking.user) !== req.user.id && req.user.role !== "admin")
    ) {
      return res.status(404).json({ message: "Запись не найдена" });
    }
    if (booking.status === "completed") {
      return res
        .status(400)
        .json({ message: "Завершённую консультацию нельзя отменить" });
    }
    booking.status = "cancelled";
    await booking.save();
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

// Все записи (для психолога). Из пользователя берём только псевдоним
router.get("/", isAdmin, async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const bookings = await Booking.find(filter)
      .populate("consultation", "topic specialist price duration")
      .populate("user", "profile.nickname")
      .sort({ scheduledAt: 1 })
      .lean({ virtuals: false });
    res.json(
      bookings.map((b) => ({
        ...b,
        id: String(b._id),
        user: b.user && { id: String(b.user._id), nickname: b.user.profile?.nickname },
      })),
    );
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
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );
    if (!booking) {
      return res.status(404).json({ message: "Запись не найдена" });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
