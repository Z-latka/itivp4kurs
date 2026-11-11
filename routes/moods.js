const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { User } = require("../models");
const { authenticateToken } = require("../middleware/auth");

const FEELINGS = [
  "спокойствие",
  "радость",
  "благодарность",
  "энергия",
  "тревога",
  "усталость",
  "грусть",
  "раздражение",
  "одиночество",
  "стресс",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.use(authenticateToken);

router.get("/feelings", (req, res) => {
  res.json(FEELINGS);
});

router.get("/", async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [entries, summary] = await Promise.all([
      User.aggregate([
        { $match: { _id: userId } },
        { $unwind: "$moods" },
        { $match: { "moods.date": { $gte: since } } },
        { $replaceRoot: { newRoot: "$moods" } },
        { $sort: { date: -1 } },
        { $addFields: { id: { $toString: "$_id" } } },
      ]),
      User.aggregate([
        { $match: { _id: userId } },
        { $unwind: "$moods" },
        { $match: { "moods.date": { $gte: since } } },
        {
          $facet: {
            overall: [
              { $group: { _id: null, average: { $avg: "$moods.mood" }, count: { $sum: 1 } } },
            ],
            feelings: [
              { $unwind: "$moods.feelings" },
              { $group: { _id: "$moods.feelings", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 5 },
              { $project: { _id: 0, feeling: "$_id", count: 1 } },
            ],
          },
        },
      ]),
    ]);

    const overall = summary[0]?.overall[0];
    res.json({
      entries,
      average: overall ? Number(overall.average.toFixed(1)) : null,
      count: overall ? overall.count : 0,
      topFeelings: summary[0]?.feelings || [],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const date = req.body.date || new Date().toISOString().slice(0, 10);
    const mood = Number(req.body.mood);
    if (!DATE_RE.test(date)) {
      return res.status(400).json({ message: "Дата должна быть в формате ГГГГ-ММ-ДД" });
    }
    if (!Number.isInteger(mood) || mood < 1 || mood > 5) {
      return res.status(400).json({ message: "Настроение — число от 1 до 5" });
    }
    const feelings = [].concat(req.body.feelings || []).filter((f) => FEELINGS.includes(f));
    const note = (req.body.note || "").trim();

    const updated = await User.updateOne(
      { _id: req.user.id, "moods.date": date },
      {
        $set: {
          "moods.$.mood": mood,
          "moods.$.feelings": feelings,
          "moods.$.note": note,
        },
      },
      { runValidators: true },
    );

    if (updated.matchedCount === 0) {
      await User.updateOne(
        { _id: req.user.id },
        { $push: { moods: { date, mood, feelings, note } } },
        { runValidators: true },
      );
    }

    const user = await User.findOne(
      { _id: req.user.id },
      { moods: { $elemMatch: { date } } },
    );
    res.status(updated.matchedCount === 0 ? 201 : 200).json(user.moods[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:moodId", async (req, res, next) => {
  try {
    const result = await User.updateOne(
      { _id: req.user.id },
      { $pull: { moods: { _id: req.params.moodId } } },
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Запись не найдена" });
    }
    res.json({ message: "Запись удалена" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
