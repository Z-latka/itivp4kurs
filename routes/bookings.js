const express = require("express");
const router = express.Router();
const { Booking, Consultation } = require("../models");
const { authenticateToken, isStaff } = require("../middleware/auth");

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

router.use(authenticateToken);

const populateConsultation = {
  path: "consultation",
  select: "-reviews",
  populate: { path: "psychologist", select: Consultation.PSYCHOLOGIST_FIELDS },
};

const serialize = (booking) => {
  const json = booking.toJSON();
  if (booking.consultation && booking.consultation.toClient) {
    json.consultation = booking.consultation.toClient();
  }
  if (booking.user && booking.user.profile) {
    json.user = { id: String(booking.user._id), nickname: booking.user.profile.nickname };
  }
  return json;
};

const staffFilter = (req) => (req.user.role === "admin" ? {} : { psychologist: req.user.id });

router.post("/", async (req, res, next) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Записываться на консультации могут только клиенты" });
    }
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

    const busyFor = [{ consultation: consultation._id }, { user: req.user.id }];
    if (consultation.psychologist) busyFor.push({ psychologist: consultation.psychologist });
    const conflict = await Booking.findOne({
      scheduledAt: date,
      status: { $ne: "cancelled" },
      $or: busyFor,
    });
    if (conflict) {
      return res.status(409).json({
        message: String(conflict.user) === req.user.id
          ? "У вас уже есть запись на это время"
          : "Это время уже занято, выберите другое",
      });
    }

    const booking = await Booking.create({
      user: req.user.id,
      consultation: consultation._id,
      psychologist: consultation.psychologist,
      scheduledAt: date,
      format,
      comment,
    });
    await booking.populate(populateConsultation);
    res.status(201).json(serialize(booking));
  } catch (err) {
    next(err);
  }
});

router.get("/my", async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate(populateConsultation)
      .sort({ scheduledAt: -1 });
    res.json(bookings.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    const allowed =
      booking &&
      (String(booking.user) === req.user.id ||
        req.user.role === "admin" ||
        (req.user.role === "psychologist" && String(booking.psychologist) === req.user.id));
    if (!allowed) {
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

router.get("/", isStaff, async (req, res, next) => {
  try {
    const filter = staffFilter(req);
    if (req.query.status) filter.status = req.query.status;
    const bookings = await Booking.find(filter)
      .populate(populateConsultation)
      .populate("user", "profile.nickname")
      .sort({ scheduledAt: 1 });
    res.json(bookings.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", isStaff, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "Недопустимый статус" });
    }
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, ...staffFilter(req) },
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
