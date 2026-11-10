require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
const {
  sequelize,
  User,
  Consultation,
  Booking,
  TestResult,
  Question,
} = require("./models");
const consultationsRouter = require("./routes/consultations");
const authRouter = require("./routes/auth");
const bookingsRouter = require("./routes/bookings");
const testsRouter = require("./routes/tests");
const questionsRouter = require("./routes/questions");

app.use(express.json());
app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", server: "psychology-api", port: PORT });
});

// Общая статистика сервиса для главной страницы и панели психолога
app.get("/api/stats", async (req, res, next) => {
  try {
    const [users, consultations, bookings, testsTaken, questions, openQuestions] =
      await Promise.all([
        User.count(),
        Consultation.count(),
        Booking.count(),
        TestResult.count(),
        Question.count(),
        Question.count({ where: { status: "open" } }),
      ]);
    res.json({ users, consultations, bookings, testsTaken, questions, openQuestions });
  } catch (err) {
    next(err);
  }
});

app.use("/api/consultations", consultationsRouter);
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/tests", testsRouter);
app.use("/api/questions", questionsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Маршрут не найден",
    message: `Маршрут ${req.method} ${req.url} не существует`,
  });
});

app.use((err, req, res, next) => {
  // Ошибки валидации Sequelize и неверный формат id — это ошибки клиента
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeDatabaseError"
  ) {
    return res.status(400).json({
      error: "Неверные данные запроса",
      message: err.errors ? err.errors.map((e) => e.message).join("; ") : err.message,
    });
  }
  console.error(err.stack);
  res.status(500).json({
    error: "Внутренняя ошибка сервера",
    message: "Что-то пошло не так на сервере",
  });
});

sequelize
  .authenticate()
  .then(() => {
    console.log("База данных PostgreSQL успешно подключена.");
  })
  .catch((err) => {
    console.error("Ошибка подключения к базе данных:", err);
  });

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
