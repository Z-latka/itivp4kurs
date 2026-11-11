const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const { User, Consultation, Booking, Question } = require("../models");
const { authenticateToken, isAdmin } = require("../middleware/auth");

router.use(authenticateToken, isAdmin);

const SPECIALIST_FIELDS = ["fullName", "title", "experienceYears", "education", "approach", "about", "topics"];

const pickSpecialist = (body = {}) =>
  Object.fromEntries(
    SPECIALIST_FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]),
  );

const staffCard = (u) => ({
  id: u.id,
  email: u.email,
  active: u.active,
  createdAt: u.createdAt,
  ...(u.specialist?.toObject?.() || {}),
});

router.get("/psychologists", async (req, res, next) => {
  try {
    const list = await User.find({ role: "psychologist" })
      .select("email active specialist createdAt")
      .sort({ active: -1, "specialist.fullName": 1 });
    const [consultations, upcoming] = await Promise.all([
      Consultation.aggregate([{ $group: { _id: "$psychologist", count: { $sum: 1 } } }]),
      Booking.aggregate([
        { $match: { status: { $in: ["pending", "confirmed"] }, scheduledAt: { $gte: new Date() } } },
        { $group: { _id: "$psychologist", count: { $sum: 1 } } },
      ]),
    ]);
    const byId = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
    const c = byId(consultations);
    const b = byId(upcoming);
    res.json(list.map((u) => ({ ...staffCard(u), consultations: c[u.id] || 0, upcoming: b[u.id] || 0 })));
  } catch (err) {
    next(err);
  }
});

router.post("/psychologists", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: "Укажите email и пароль (минимум 6 символов)" });
    }
    if (await User.findByEmail(email)) {
      return res.status(400).json({ message: "Пользователь с таким email уже существует" });
    }
    const specialist = pickSpecialist(req.body);
    const user = await User.create({
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "psychologist",
      profile: { nickname: specialist.fullName },
      specialist,
    });
    res.status(201).json(staffCard(user));
  } catch (err) {
    next(err);
  }
});

router.patch("/psychologists/:id", async (req, res, next) => {
  try {
    const update = {};
    Object.entries(pickSpecialist(req.body)).forEach(([k, v]) => {
      update[`specialist.${k}`] = v;
    });
    if (req.body.fullName) update["profile.nickname"] = req.body.fullName;
    if (typeof req.body.active === "boolean") update.active = req.body.active;

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "psychologist" },
      { $set: update },
      { returnDocument: "after", runValidators: true },
    );
    if (!user) return res.status(404).json({ message: "Психолог не найден" });

    if (typeof req.body.active === "boolean") {
      await Consultation.updateMany(
        { psychologist: user._id, status: req.body.active ? "busy" : { $ne: "busy" } },
        { status: req.body.active ? "available" : "busy" },
      );
    }
    res.json(staffCard(user));
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const [usersByRole, bookingsByStatus, popular, questionsByStatus, queue] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Booking.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: "$consultation", bookings: { $sum: 1 } } },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
        { $lookup: { from: "consultations", localField: "_id", foreignField: "_id", as: "consultation" } },
        { $unwind: "$consultation" },
        { $project: { _id: 0, id: { $toString: "$_id" }, topic: "$consultation.topic", bookings: 1 } },
      ]),
      Question.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Question.countDocuments({ psychologist: null, status: { $ne: "closed" } }),
    ]);
    const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
    res.json({
      users: toMap(usersByRole),
      bookings: toMap(bookingsByStatus),
      questions: { ...toMap(questionsByStatus), queue },
      popular,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
