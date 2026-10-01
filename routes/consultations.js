const express = require("express");
const router = express.Router();
const { Consultation } = require("../models");

router.get("/", async (req, res, next) => {
  try {
    const consultations = await Consultation.findAll();
    res.json(consultations);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) {
      return res.status(404).json({
        error: "Консультация не найдена",
        message: `Консультация с ID ${req.params.id} не существует`,
      });
    }
    res.json(consultation);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { topic, description, duration, status, price } = req.body;
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
    });

    res.status(201).json(newConsultation);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { topic, description, duration, status, price } = req.body;
    const consultation = await Consultation.findByPk(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        error: "Консультация не найдена",
        message: `Консультация с ID ${req.params.id} не существует`,
      });
    }

    await consultation.update({ topic, description, duration, status, price });
    res.json(consultation);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const consultation = await Consultation.findByPk(req.params.id);
    if (!consultation) {
      return res.status(404).json({
        error: "Консультация не найдена",
        message: `Консультация с ID ${req.params.id} не существует`,
      });
    }

    await consultation.destroy();
    res.json({
      message: "Консультация успешно удалена",
      consultation,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
