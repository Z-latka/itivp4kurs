const dns = require("dns");
const mongoose = require("mongoose");

// Подключение к MongoDB (Atlas или локальный сервер) по строке из .env
const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Переменная окружения MONGO_URI не задана (см. .env.example)");
  }

  // Строка mongodb+srv:// требует DNS-запроса типа SRV. На части Windows-сетей
  // Node.js не получает ответ от DNS роутера (querySrv ETIMEOUT) — тогда
  // в MONGO_DNS указываются публичные DNS-серверы, например 8.8.8.8,1.1.1.1
  if (process.env.MONGO_DNS) {
    dns.setServers(process.env.MONGO_DNS.split(",").map((s) => s.trim()));
  }

  mongoose.connection.on("disconnected", () =>
    console.log("MongoDB disconnected"),
  );

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB || "mindcare",
    serverSelectionTimeoutMS: 10000,
  });
  const { host, name } = mongoose.connection;
  console.log(`MongoDB connected: ${host}/${name}`);
  return mongoose.connection;
};

module.exports = connectDB;
