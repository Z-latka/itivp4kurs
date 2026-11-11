const express = require("express");
const router = express.Router();
const { User, Consultation } = require("../models");

const consultationStats = async (ids) => {
  const rows = await Consultation.aggregate([
    { $match: { psychologist: { $in: ids } } },
    {
      $group: {
        _id: "$psychologist",
        consultations: { $sum: 1 },
        minPrice: { $min: "$price" },
        reviewsCount: { $sum: { $size: "$reviews" } },
        ratingSum: { $sum: { $sum: "$reviews.rating" } },
        tags: { $push: "$tags" },
      },
    },
  ]);
  return Object.fromEntries(
    rows.map((r) => [
      String(r._id),
      {
        consultations: r.consultations,
        minPrice: r.minPrice,
        reviewsCount: r.reviewsCount,
        rating: r.reviewsCount ? Number((r.ratingSum / r.reviewsCount).toFixed(1)) : null,
        tags: [...new Set(r.tags.flat())],
      },
    ]),
  );
};

router.get("/", async (req, res, next) => {
  try {
    const psychologists = await User.find({ role: "psychologist", active: true })
      .select("specialist")
      .sort({ "specialist.fullName": 1 });
    const stats = await consultationStats(psychologists.map((p) => p._id));
    res.json(
      psychologists.map((p) => ({
        ...p.toSpecialistCard(),
        consultations: 0,
        rating: null,
        reviewsCount: 0,
        tags: [],
        ...stats[p.id],
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const psychologist = await User.findOne({
      _id: req.params.id,
      role: "psychologist",
      active: true,
    }).select("specialist");
    if (!psychologist) {
      return res.status(404).json({ message: "Специалист не найден" });
    }
    const [stats, consultations] = await Promise.all([
      consultationStats([psychologist._id]),
      Consultation.find({ psychologist: psychologist._id })
        .populate("psychologist", Consultation.PSYCHOLOGIST_FIELDS)
        .sort({ price: 1 }),
    ]);
    res.json({
      ...psychologist.toSpecialistCard(),
      ...stats[psychologist.id],
      consultations: consultations.map((c) => {
        const json = c.toClient();
        delete json.reviews;
        return json;
      }),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
