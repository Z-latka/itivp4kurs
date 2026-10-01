require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const { sequelize } = require("./models");
const consultationsRouter = require("./routes/consultations");
const authRouter = require("./routes/auth");

app.use(express.json());

app.use("/consultations", consultationsRouter);
app.use("/auth", authRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Маршрут не найден",
    message: `Маршрут ${req.method} ${req.url} не существует`,
  });
});

app.use((err, req, res, next) => {
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
    app.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Ошибка подключения к базе данных:", err);
  });
