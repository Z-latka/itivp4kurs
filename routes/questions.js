const express = require("express");
const router = express.Router();
const { Question } = require("../models");
const { authenticateToken, isPsychologist } = require("../middleware/auth");

router.use(authenticateToken);

const withPeople = (query) =>
  query.populate("user", "profile.nickname").populate("psychologist", "specialist.fullName specialist.title");

const serialize = (question) => {
  const json = question.toJSON();
  const author = question.user;
  json.user = author && author.profile ? { nickname: author.profile.nickname } : undefined;
  const p = question.psychologist;
  json.psychologist = p && p.specialist
    ? { id: String(p._id), fullName: p.specialist.fullName, title: p.specialist.title }
    : null;
  return json;
};

const loadAccessible = async (req, res) => {
  const question = await withPeople(Question.findById(req.params.id));
  if (!question || !question.canAccess(req.user)) {
    res.status(404).json({ message: "Обращение не найдено" });
    return null;
  }
  return question;
};

router.post("/", async (req, res, next) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Обращения создают только клиенты" });
    }
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
    const questions = await withPeople(Question.find({ user: req.user.id }).sort({ updatedAt: -1 }));
    res.json(questions.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.get("/", isPsychologist, async (req, res, next) => {
  try {
    const queue = { psychologist: null, status: { $ne: "closed" } };
    const mine = { psychologist: req.user.id };
    const filter =
      req.query.scope === "queue" ? queue : req.query.scope === "mine" ? mine : { $or: [queue, mine] };
    const questions = await withPeople(Question.find(filter).sort({ updatedAt: -1 }));
    res.json(questions.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const question = await loadAccessible(req, res);
    if (question) res.json(serialize(question));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/assign", isPsychologist, async (req, res, next) => {
  try {
    const question = await withPeople(
      Question.findOneAndUpdate(
        { _id: req.params.id, psychologist: null },
        { psychologist: req.user.id },
        { returnDocument: "after" },
      ),
    );
    if (!question) {
      return res.status(409).json({ message: "Обращение уже взял другой специалист" });
    }
    res.json(serialize(question));
  } catch (err) {
    next(err);
  }
});

router.post("/:id/messages", async (req, res, next) => {
  try {
    const question = await loadAccessible(req, res);
    if (!question) return;
    if (question.status === "closed") {
      return res.status(400).json({ message: "Обращение закрыто" });
    }
    const text = (req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "Сообщение не может быть пустым" });
    }
    const fromPsychologist = req.user.role === "psychologist";

    const filter = { _id: question._id };
    const update = {
      $push: { messages: { authorRole: fromPsychologist ? "psychologist" : "user", text } },
      $set: { status: fromPsychologist ? "answered" : "open" },
    };
    if (fromPsychologist) {
      filter.psychologist = { $in: [null, req.user.id] };
      update.$set.psychologist = req.user.id;
    }

    const updated = await Question.findOneAndUpdate(filter, update, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!updated) {
      return res.status(409).json({ message: "Обращение уже взял другой специалист" });
    }
    res.status(201).json(updated.messages.at(-1));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/close", async (req, res, next) => {
  try {
    const question = await loadAccessible(req, res);
    if (!question) return;
    question.status = "closed";
    await question.save();
    res.json(serialize(question));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const question = await loadAccessible(req, res);
    if (!question) return;
    if (!question.isOwnedBy(req.user.id)) {
      return res.status(403).json({ message: "Удалить обращение может только его автор" });
    }
    const deleted = await Question.findByIdAndDelete(question._id);
    res.json({ message: "Обращение удалено", question: deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
