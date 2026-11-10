const express = require("express");
const router = express.Router();
const { User } = require("../models");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { TESTS, publicTest, findTest, scoreTest } = require("../data/tests");

router.get("/", (req, res) => {
  res.json(TESTS.map((t) => publicTest(t)));
});

// История результатов: вложенный массив testResults документа пользователя
router.get("/results/my", authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("testResults");
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });
    const results = user.toJSON().testResults;
    results.sort((a, b) => b.takenAt - a.takenAt);
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

// Гость получает результат без сохранения, авторизованный —
// результат добавляется ($push) в массив testResults его документа
router.post("/:id/submit", optionalAuth, async (req, res, next) => {
  try {
    const test = findTest(req.params.id);
    if (!test) return res.status(404).json({ message: "Тест не найден" });

    const result = scoreTest(test, req.body.answers);
    if (result.error) return res.status(400).json({ message: result.error });

    let saved = null;
    if (req.user) {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $push: {
            testResults: {
              testId: test.id,
              testTitle: test.title,
              score: result.score,
              maxScore: result.maxScore,
              level: result.level.key,
              levelTitle: result.level.title,
              answers: result.answers,
            },
          },
        },
        { returnDocument: "after", projection: { testResults: { $slice: -1 } } },
      );
      saved = user && user.testResults[0];
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
