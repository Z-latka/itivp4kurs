const express = require("express");
const router = express.Router();
let { consultations, nextId } = require("../models/consultations");

router.get("/", (req, res) => {
  res.json(consultations);
});

router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const consultation = consultations.find((c) => c.id === id);

  if (!consultation) {
    return res.status(404).json({
      error: "Консультация не найдена",
      message: `Консультация с ID ${id} не существует`,
    });
  }

  res.json(consultation);
});

router.post("/", (req, res) => {
  const { topic, description, duration } = req.body;

  if (!topic || !description || !duration) {
    return res.status(400).json({
      error: "Неверные данные запроса",
      message: "Поля topic, description и duration обязательны",
    });
  }

  if (typeof duration !== "number" || duration <= 0) {
    return res.status(400).json({
      error: "Неверные данные запроса",
      message: "Duration должен быть положительным числом",
    });
  }

  const newConsultation = {
    id: nextId++,
    topic,
    description,
    duration,
    status: "available",
    createdAt: new Date().toISOString(),
  };

  consultations.push(newConsultation);
  res.status(201).json(newConsultation);
});

router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { topic, description, duration, status } = req.body;

  if (!topic || !description || !duration || !status) {
    return res.status(400).json({
      error: "Неверные данные запроса",
      message: "Все поля обязательны для полного обновления",
    });
  }

  const index = consultations.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Консультация не найдена",
      message: `Консультация с ID ${id} не существует`,
    });
  }

  consultations[index] = {
    id,
    topic,
    description,
    duration,
    status,
    createdAt: consultations[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  res.json(consultations[index]);
});

router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = consultations.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Консультация не найдена",
      message: `Консультация с ID ${id} не существует`,
    });
  }

  const deleted = consultations.splice(index, 1);
  res.json({
    message: "Консультация успешно удалена",
    consultation: deleted[0],
  });
});

module.exports = router;
