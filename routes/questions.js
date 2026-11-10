const express = require("express");
const router = express.Router();
const { Question, Message, User } = require("../models");
const { authenticateToken, isAdmin } = require("../middleware/auth");

router.use(authenticateToken);

const withMessages = {
  include: [{ model: Message, as: "messages" }],
  order: [[{ model: Message, as: "messages" }, "createdAt", "ASC"]],
};

// Доступ к обращению есть только у автора и у психолога (admin)
const loadOwned = async (req, res) => {
  const question = await Question.findByPk(req.params.id, {
    ...withMessages,
    include: [
      ...withMessages.include,
      { model: User, as: "user", attributes: ["nickname"] },
    ],
  });
  if (
    !question ||
    (question.userId !== req.user.id && req.user.role !== "admin")
  ) {
    res.status(404).json({ message: "Обращение не найдено" });
    return null;
  }
  return question;
};

// Новое анонимное обращение к психологу
router.post("/", async (req, res, next) => {
  try {
    const topic = (req.body.topic || "").trim();
    const text = (req.body.text || "").trim();
    if (!topic || !text) {
      return res
        .status(400)
        .json({ message: "Укажите тему и текст обращения" });
    }
    const question = await Question.create({ userId: req.user.id, topic });
    await Message.create({ questionId: question.id, authorRole: "user", text });
    const full = await Question.findByPk(question.id, withMessages);
    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
});

router.get("/my", async (req, res, next) => {
  try {
    const questions = await Question.findAll({
      where: { userId: req.user.id },
      ...withMessages,
      order: [
        ["updatedAt", "DESC"],
        [{ model: Message, as: "messages" }, "createdAt", "ASC"],
      ],
    });
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

// Все обращения — для психолога. Клиент виден только по псевдониму
router.get("/", isAdmin, async (req, res, next) => {
  try {
    const questions = await Question.findAll({
      include: [
        { model: Message, as: "messages" },
        { model: User, as: "user", attributes: ["nickname"] },
      ],
      order: [
        ["updatedAt", "DESC"],
        [{ model: Message, as: "messages" }, "createdAt", "ASC"],
      ],
    });
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const question = await loadOwned(req, res);
    if (question) res.json(question);
  } catch (err) {
    next(err);
  }
});

// Сообщение в переписке: от клиента или ответ психолога
router.post("/:id/messages", async (req, res, next) => {
  try {
    const question = await loadOwned(req, res);
    if (!question) return;
    if (question.status === "closed") {
      return res.status(400).json({ message: "Обращение закрыто" });
    }
    const text = (req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Сообщение не может быть пустым" });
    }
    const isPsychologist =
      req.user.role === "admin" && question.userId !== req.user.id;
    const message = await Message.create({
      questionId: question.id,
      authorRole: isPsychologist ? "psychologist" : "user",
      text,
    });
    question.status = isPsychologist ? "answered" : "open";
    question.changed("updatedAt", true);
    await question.save();
    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/close", async (req, res, next) => {
  try {
    const question = await loadOwned(req, res);
    if (!question) return;
    await question.update({ status: "closed" });
    res.json(question);
  } catch (err) {
    next(err);
  }
});

// Удаление обращения вместе с перепиской (каскад на уровне FK)
router.delete("/:id", async (req, res, next) => {
  try {
    const question = await loadOwned(req, res);
    if (!question) return;
    await question.destroy();
    res.json({ message: "Обращение удалено", question });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
