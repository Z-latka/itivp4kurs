const express = require("express");
const router = express.Router();
const { Consultation, User, Booking } = require("../models");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const FIELDS = ["topic", "description", "duration", "status", "price", "specialist", "tags"];

const pick = (body) =>
  Object.fromEntries(
    FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]),
  );

const notFound = (res, id) =>
  res.status(404).json({
    error: "Консультация не найдена",
    message: `Консультация с ID ${id} не существует`,
  });

// GET /consultations → Model.find()
// Фильтры: ?tag=тревога (поиск по элементу массива), ?search=текст, ?maxPrice=100
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.search) {
      const re = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ topic: re }, { description: re }, { specialist: re }];
    }
    if (req.query.maxPrice !== undefined) {
      filter.price = { $lte: Number(req.query.maxPrice) };
    }

    const consultations = await Consultation.find(filter).sort({ createdAt: 1 });
    // В списке отдаём рейтинг и число отзывов, без самих отзывов
    res.json(
      consultations.map((c) => {
        const json = c.toJSON();
        delete json.reviews;
        return json;
      }),
    );
  } catch (err) {
    next(err);
  }
});

// Aggregation pipeline: популярность тегов и средний рейтинг по каждому тегу
router.get("/stats/tags", async (req, res, next) => {
  try {
    const stats = await Consultation.aggregate([
      { $unwind: "$tags" },
      {
        $group: {
          _id: "$tags",
          consultations: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          reviews: { $sum: { $size: "$reviews" } },
          avgRating: { $avg: { $avg: "$reviews.rating" } },
        },
      },
      { $sort: { consultations: -1, _id: 1 } },
      {
        $project: {
          _id: 0,
          tag: "$_id",
          consultations: 1,
          reviews: 1,
          avgPrice: { $round: ["$avgPrice", 1] },
          avgRating: { $round: ["$avgRating", 1] },
        },
      },
    ]);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// Последние отзывы по всем консультациям (для главной страницы)
router.get("/reviews/latest", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 3, 12);
    const reviews = await Consultation.aggregate([
      { $unwind: "$reviews" },
      { $match: { "reviews.comment": { $nin: [null, ""] }, "reviews.rating": { $gte: 4 } } },
      { $sort: { "reviews.createdAt": -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          id: { $toString: "$reviews._id" },
          consultationId: { $toString: "$_id" },
          topic: 1,
          nickname: "$reviews.nickname",
          rating: "$reviews.rating",
          comment: "$reviews.comment",
          createdAt: "$reviews.createdAt",
        },
      },
    ]);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

// Занятое время консультации в диапазоне дат: клиент показывает свободные слоты
router.get("/:id/slots", async (req, res, next) => {
  try {
    const from = new Date(req.query.from || Date.now());
    const to = new Date(req.query.to || from.getTime() + 14 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ message: "Некорректный диапазон дат" });
    }
    const busy = await Booking.find({
      consultation: req.params.id,
      status: { $ne: "cancelled" },
      scheduledAt: { $gte: from, $lte: to },
    }).distinct("scheduledAt");
    res.json(busy.map((d) => new Date(d).toISOString()));
  } catch (err) {
    next(err);
  }
});

// GET /consultations/:id → Model.findById(id)
router.get("/:id", async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return notFound(res, req.params.id);
    const json = consultation.toJSON();
    json.reviews.sort((a, b) => b.createdAt - a.createdAt);
    res.json(json);
  } catch (err) {
    next(err);
  }
});

// POST /consultations → Model.create(body)
router.post("/", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const newConsultation = await Consultation.create(pick(req.body));
    res.status(201).json(newConsultation);
  } catch (err) {
    next(err);
  }
});

// PUT /consultations/:id → Model.findByIdAndUpdate(id, body, { new: true })
// (в Mongoose 9 опция new устарела, её эквивалент — returnDocument: "after")
router.put("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      pick(req.body),
      { returnDocument: "after", runValidators: true },
    );
    if (!consultation) return notFound(res, req.params.id);
    res.json(consultation);
  } catch (err) {
    next(err);
  }
});

// DELETE /consultations/:id → Model.findByIdAndDelete(id)
// Возвращает удалённый документ; связанные записи удаляются хуком (каскад)
router.delete("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const consultation = await Consultation.findByIdAndDelete(req.params.id);
    if (!consultation) return notFound(res, req.params.id);
    res.json({
      message: "Консультация успешно удалена",
      consultation,
    });
  } catch (err) {
    next(err);
  }
});

// ===== Вложенный массив reviews =====

// Добавление отзыва: $push во вложенный массив.
// Один отзыв на пользователя: условие "reviews.user": { $ne } не даёт добавить второй
router.post("/:id/reviews", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("profile");
    const review = {
      user: req.user.id,
      nickname: user?.profile?.nickname || "Аноним",
      rating: Number(req.body.rating),
      comment: req.body.comment,
    };
    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, "reviews.user": { $ne: req.user.id } },
      { $push: { reviews: review } },
      { returnDocument: "after", runValidators: true },
    );
    if (!consultation) {
      if (await Consultation.exists({ _id: req.params.id })) {
        return res
          .status(400)
          .json({ message: "Вы уже оставили отзыв — его можно изменить" });
      }
      return notFound(res, req.params.id);
    }
    res.status(201).json(consultation.reviews.at(-1));
  } catch (err) {
    next(err);
  }
});

// Изменение элемента массива по месту: позиционный оператор $
// Автор может менять свой отзыв, психолог (admin) — любой
router.patch("/:id/reviews/:reviewId", authenticateToken, async (req, res, next) => {
  try {
    const match = { _id: req.params.reviewId };
    if (req.user.role !== "admin") match.user = req.user.id;

    const update = {};
    if (req.body.rating !== undefined) update["reviews.$.rating"] = Number(req.body.rating);
    if (req.body.comment !== undefined) update["reviews.$.comment"] = req.body.comment;

    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, reviews: { $elemMatch: match } },
      { $set: update },
      { returnDocument: "after", runValidators: true },
    );
    if (!consultation) {
      return res.status(404).json({ message: "Отзыв не найден" });
    }
    res.json(consultation.reviews.id(req.params.reviewId));
  } catch (err) {
    next(err);
  }
});

// Удаление элемента массива: $pull
router.delete("/:id/reviews/:reviewId", authenticateToken, async (req, res, next) => {
  try {
    const match = { _id: req.params.reviewId };
    if (req.user.role !== "admin") match.user = req.user.id;

    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, reviews: { $elemMatch: match } },
      { $pull: { reviews: { _id: req.params.reviewId } } },
      { returnDocument: "after" },
    );
    if (!consultation) {
      return res.status(404).json({ message: "Отзыв не найден" });
    }
    res.json({ message: "Отзыв удалён", reviewsCount: consultation.reviews.length });
  } catch (err) {
    next(err);
  }
});

// ===== Массив строк tags =====

// $addToSet добавляет теги без дубликатов
router.post("/:id/tags", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const tags = [].concat(req.body.tags || req.body.tag || []).map(String);
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: { $each: tags } } },
      { returnDocument: "after" },
    );
    if (!consultation) return notFound(res, req.params.id);
    res.json(consultation.tags);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/tags/:tag", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { $pull: { tags: req.params.tag } },
      { returnDocument: "after" },
    );
    if (!consultation) return notFound(res, req.params.id);
    res.json(consultation.tags);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
