const express = require("express");
const app = express();
const PORT = 3000;

const consultationsRouter = require("./routes/consultations");

app.use(express.json());

app.use("/consultations", consultationsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Внутренняя ошибка сервера",
    message: "Что-то пошло не так на сервере",
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Маршрут не найден",
    message: `Маршрут ${req.method} ${req.url} не существует`,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("API для сервиса психологической поддержки запущен");
});
