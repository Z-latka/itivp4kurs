const express = require("express");
const router = express.Router();
const { Question } = require("../models");
const { authenticateToken, isAdmin } = require("../middleware/auth");

router.use(authenticateToken);

// Псевдоним автора — единственное, что психолог знает о клиенте
const withNickname = (query) => query.populate("user", "profile.nickname");

const serialize = (question) => {
  const json = question.toJSON();
  const author = question.user;
  json.user = author && author.profile ? { nickname: author.profile.nickname } : undefined;
  return json;
};

// Доступ к обращению есть только у автора и у психолога (admin)
const loadOwned = async (req, res) => {
  const question = await withNickname(Question.findById(req.params.id));
  if (!question || (!question.isOwnedBy(req.user.id) && req.user.role !== "admin")) {
    res.status(404).json({ message: "Обращение не найдено" });
    return null;
  }
  return question;
};

// Новое обращение: первое сообщение сразу кладётся во вложенный массив
router.post("/", async (req, res, next) => {
  try {
    const topic = (req.body.topic || "").trim();
    const text = (req.body.text || "").trim();
    if (!topic || !text) {
      return res
        .status(400)
        .json({ message: "Укажите тему и текст обращения" });
    }
    const question = await Question.create({
      user: req.user.id,
      topic,
      messages: [{ authorRole: "user", text }],
    });
    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
});

router.get("/my", async (req, res, next) => {
  try {
    const questions = await Question.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

// Все обращения (для психолога), фильтр ?status=open
router.get("/", isAdmin, async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const questions = await withNickname(Question.find(filter).sort({ updatedAt: -1 }));
    res.json(questions.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const question = await loadOwned(req, res);
    if (question) res.json(serialize(question));
  } catch (err) {
    next(err);
  }
});

// Новое сообщение: $push в массив messages и смена статуса одной атомарной операцией
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
    const isPsychologist = req.user.role === "admin" && !question.isOwnedBy(req.user.id);

    const updated = await Question.findByIdAndUpdate(
      question._id,
      {
        $push: { messages: { authorRole: isPsychologist ? "psychologist" : "user", text } },
        $set: { status: isPsychologist ? "answered" : "open" },
      },
      { returnDocument: "after", runValidators: true },
    );
    res.status(201).json(updated.messages.at(-1));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/close", async (req, res, next) => {
  try {
    const question = await loadOwned(req, res);
    if (!question) return;
    question.status = "closed";
    await question.save();
    res.json(serialize(question));
  } catch (err) {
    next(err);
  }
});

// Удаление обращения: переписка удаляется вместе с документом
router.delete("/:id", async (req, res, next) => {
  try {
    const question = await loadOwned(req, res);
    if (!question) return;
    const deleted = await Question.findByIdAndDelete(question._id);
    res.json({ message: "Обращение удалено", question: deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
