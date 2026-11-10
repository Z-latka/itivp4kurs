const mongoose = require("mongoose");
const { toJSONOptions } = require("./toJSON");

// Отзыв — вложенный документ (subdocument) внутри консультации.
// Псевдоним автора денормализован: для показа отзывов не нужен JOIN с users
const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nickname: String,
    rating: {
      type: Number,
      required: true,
      min: [1, "Оценка от 1 до 5"],
      max: [5, "Оценка от 1 до 5"],
      validate: { validator: Number.isInteger, message: "Оценка должна быть целым числом" },
    },
    comment: { type: String, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: toJSONOptions },
);

const consultationSchema = new mongoose.Schema(
  {
    topic: { type: String, required: [true, "Поле topic обязательно"], trim: true },
    description: { type: String, required: [true, "Поле description обязательно"] },
    duration: { type: Number, required: [true, "Поле duration обязательно"], min: 1 },
    status: {
      type: String,
      enum: ["available", "active", "completed", "busy"],
      default: "available",
    },
    price: { type: Number, default: 0, min: 0 },
    // Ссылка на аккаунт психолога (отдельная коллекция users) — подставляется через populate
    psychologist: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    tags: { type: [String], index: true }, // массив строк + индекс
    reviews: [reviewSchema],
  },
  { timestamps: true, toJSON: toJSONOptions },
);

// Метод экземпляра: средняя оценка по вложенным отзывам
consultationSchema.methods.averageRating = function averageRating() {
  if (!this.reviews || this.reviews.length === 0) return null;
  const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
  return Number((sum / this.reviews.length).toFixed(1));
};

consultationSchema.virtual("rating").get(function rating() {
  return this.reviews ? this.averageRating() : undefined;
});

consultationSchema.virtual("reviewsCount").get(function reviewsCount() {
  return this.reviews ? this.reviews.length : undefined;
});

// Поля психолога, которые подставляются через populate
consultationSchema.statics.PSYCHOLOGIST_FIELDS = "specialist.fullName specialist.title active";

// Представление для клиента: вместо ObjectId — имя и специализация психолога.
// Работает и без populate (тогда остаётся только id)
consultationSchema.methods.toClient = function toClient() {
  const json = this.toJSON();
  const p = this.psychologist;
  if (p && p.specialist) {
    json.psychologist = { id: String(p._id), fullName: p.specialist.fullName, title: p.specialist.title };
    json.specialist = [p.specialist.fullName, p.specialist.title].filter(Boolean).join(", ");
  } else {
    json.psychologist = p ? { id: String(p._id || p) } : null;
  }
  return json;
};

// Статический метод: поиск по тегу (поле-массив содержит значение)
consultationSchema.statics.findByTag = function findByTag(tag) {
  return this.find({ tags: tag });
};

// Каскадное удаление: при удалении консультации удаляются её записи
consultationSchema.post("findOneAndDelete", async (doc) => {
  if (doc) {
    await mongoose.model("Booking").deleteMany({ consultation: doc._id });
  }
});

module.exports = mongoose.model("Consultation", consultationSchema);
