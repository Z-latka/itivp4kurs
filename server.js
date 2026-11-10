require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const PORT = process.env.PORT || 3000;
const connectDB = require("./db");
const { User, Consultation, Booking, Question } = require("./models");
const consultationsRouter = require("./routes/consultations");
const authRouter = require("./routes/auth");
const bookingsRouter = require("./routes/bookings");
const testsRouter = require("./routes/tests");
const questionsRouter = require("./routes/questions");
const moodsRouter = require("./routes/moods");

app.use(express.json());
app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    server: "psychology-api",
    port: PORT,
    database: "MongoDB",
    connected: mongoose.connection.readyState === 1,
  });
});

// Общая статистика сервиса для главной страницы и панели психолога
app.get("/api/stats", async (req, res, next) => {
  try {
    const [users, consultations, bookings, questions, openQuestions, tests] =
      await Promise.all([
        User.countDocuments(),
        Consultation.countDocuments(),
        Booking.countDocuments(),
        Question.countDocuments(),
        Question.countDocuments({ status: "open" }),
        // Сумма длин вложенных массивов testResults по всем пользователям
        User.aggregate([
          { $group: { _id: null, total: { $sum: { $size: "$testResults" } } } },
        ]),
      ]);
    res.json({
      users,
      consultations,
      bookings,
      testsTaken: tests[0]?.total || 0,
      questions,
      openQuestions,
    });
  } catch (err) {
    next(err);
  }
});

app.use("/api/consultations", consultationsRouter);
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/tests", testsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/moods", moodsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Маршрут не найден",
    message: `Маршрут ${req.method} ${req.url} не существует`,
  });
});

app.use((err, req, res, next) => {
  // Некорректный ObjectId в параметрах запроса
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: "Неверные данные запроса",
      message: `Некорректное значение поля ${err.path}: ${err.value}`,
    });
  }
  // Нарушение правил схемы (required, min/max, enum, match)
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: "Ошибка валидации",
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join("; "),
    });
  }
  // Дубликат уникального индекса
  if (err.code === 11000) {
    return res.status(409).json({
      error: "Конфликт данных",
      message: `Значение поля ${Object.keys(err.keyValue || {}).join(", ")} уже занято`,
    });
  }
  console.error(err.stack);
  res.status(500).json({
    error: "Внутренняя ошибка сервера",
    message: "Что-то пошло не так на сервере",
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
