const mongoose = require("mongoose");
const { toJSONOptions } = require("./toJSON");

// Вложенный документ: профиль хранится внутри пользователя, без отдельной таблицы
const profileSchema = new mongoose.Schema(
  {
    nickname: { type: String, trim: true, maxlength: 40 },
    city: { type: String, trim: true },
    about: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

// Массив вложенных документов: история тестов.
// В PostgreSQL это отдельная таблица TestResults со связью по userId
const testResultSchema = new mongoose.Schema(
  {
    testId: { type: String, required: true },
    testTitle: String,
    score: { type: Number, required: true },
    maxScore: Number,
    level: String,
    levelTitle: String,
    answers: [Number],
    takenAt: { type: Date, default: Date.now },
  },
  { toJSON: toJSONOptions },
);

// Запись дневника настроения: одна на день, хранится внутри пользователя
const moodSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD
    mood: { type: Number, required: true, min: 1, max: 5 },
    feelings: [String],
    note: { type: String, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: toJSONOptions },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email обязателен"],
      unique: true, // уникальный индекс
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Некорректный email"],
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profile: { type: profileSchema, default: () => ({}) },
    testResults: [testResultSchema],
    moods: [moodSchema],
  },
  { timestamps: true, toJSON: toJSONOptions },
);

// Индекс по вложенному полю: быстрый поиск пользователей по городу
userSchema.index({ "profile.city": 1 });

// Метод экземпляра: публичное представление без хэша пароля и истории тестов
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this.id,
    email: this.email,
    nickname: this.profile?.nickname,
    profile: this.profile,
    role: this.role,
    createdAt: this.createdAt,
  };
};

// Статический метод модели
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

module.exports = mongoose.model("User", userSchema);
