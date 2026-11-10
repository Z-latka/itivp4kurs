const express = require("express");
const router = express.Router();
const { Consultation, Review, User, sequelize } = require("../models");
const { authenticateToken, isAdmin } = require("../middleware/auth");

const notFound = (res, id) =>
  res.status(404).json({
    error: "Консультация не найдена",
    message: `Консультация с ID ${id} не существует`,
  });

// Средний рейтинг и число отзывов считаются в БД через JOIN + GROUP BY
router.get("/", async (req, res, next) => {
  try {
    const consultations = await Consultation.findAll({
      attributes: {
        include: [
          [sequelize.fn("AVG", sequelize.col("reviews.rating")), "rating"],
          [sequelize.fn("COUNT", sequelize.col("reviews.id")), "reviewsCount"],
        ],
      },
      include: [{ model: Review, as: "reviews", attributes: [] }],
      group: ["Consultation.id"],
      order: [["id", "ASC"]],
    });
    res.json(
      consultations.map((c) => {
        const json = c.toJSON();
        return {
          ...json,
          rating: json.rating ? Number(Number(json.rating).toFixed(1)) : null,
          reviewsCount: Number(json.reviewsCount),
        };
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id, {
      include: [
        {
          model: Review,
          as: "reviews",
          include: [{ model: User, as: "user", attributes: ["nickname"] }],
        },
      ],
      order: [[{ model: Review, as: "reviews" }, "createdAt", "DESC"]],
    });
    if (!consultation) return notFound(res, req.params.id);
    res.json(consultation);
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const { topic, description, duration, status, price, specialist } =
      req.body;
    if (!topic || !description || !duration) {
      return res.status(400).json({
        error: "Неверные данные запроса",
        message: "Поля topic, description и duration обязательны",
      });
    }

    const newConsultation = await Consultation.create({
      topic,
      description,
      duration,
      status: status || "available",
      price: price || 0.0,
      specialist,
    });

    res.status(201).json(newConsultation);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const { topic, description, duration, status, price, specialist } =
      req.body;
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) return notFound(res, req.params.id);

    await consultation.update({
      topic,
      description,
      duration,
      status,
      price,
      specialist,
    });
    res.json(consultation);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) return notFound(res, req.params.id);

    await consultation.destroy();
    res.json({
      message: "Консультация успешно удалена",
      consultation,
    });
  } catch (err) {
    next(err);
  }
});

// Отзыв о консультации (отдельная таблица Reviews, связь по consultationId)
router.post("/:id/reviews", authenticateToken, async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) return notFound(res, req.params.id);

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Оценка должна быть целым числом от 1 до 5" });
    }

    const review = await Review.create({
      userId: req.user.id,
      consultationId: consultation.id,
      rating,
      comment: (req.body.comment || "").trim(),
    });
    const user = await User.findByPk(req.user.id, { attributes: ["nickname"] });
    res.status(201).json({ ...review.toJSON(), user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
