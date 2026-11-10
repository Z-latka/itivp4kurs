const express = require("express");
const router = express.Router();
const { TestResult } = require("../models");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { TESTS, publicTest, findTest, scoreTest } = require("../data/tests");

router.get("/", (req, res) => {
  res.json(TESTS.map((t) => publicTest(t)));
});

// История результатов текущего пользователя
router.get("/results/my", authenticateToken, async (req, res, next) => {
  try {
    const results = await TestResult.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", (req, res) => {
  const test = findTest(req.params.id);
  if (!test) return res.status(404).json({ message: "Тест не найден" });
  res.json(publicTest(test, true));
});

// Отправка ответов. Гость получает результат без сохранения,
// авторизованный пользователь — с сохранением в историю
router.post("/:id/submit", optionalAuth, async (req, res, next) => {
  try {
    const test = findTest(req.params.id);
    if (!test) return res.status(404).json({ message: "Тест не найден" });

    const result = scoreTest(test, req.body.answers);
    if (result.error) return res.status(400).json({ message: result.error });

    let saved = null;
    if (req.user) {
      saved = await TestResult.create({
        userId: req.user.id,
        testId: test.id,
        testTitle: test.title,
        score: result.score,
        maxScore: result.maxScore,
        level: result.level.key,
        levelTitle: result.level.title,
        answers: result.answers,
      });
    }

    res.status(saved ? 201 : 200).json({
      testId: test.id,
      testTitle: test.title,
      score: result.score,
      maxScore: result.maxScore,
      level: result.level.key,
      levelTitle: result.level.title,
      recommendation: result.level.text,
      crisis: result.crisis,
      saved: Boolean(saved),
      id: saved ? saved.id : null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
