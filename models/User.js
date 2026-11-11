const mongoose = require("mongoose");
const { toJSONOptions } = require("./toJSON");

const profileSchema = new mongoose.Schema(
  {
    nickname: { type: String, trim: true, maxlength: 40 },
    city: { type: String, trim: true },
    about: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

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

const moodSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    mood: { type: Number, required: true, min: 1, max: 5 },
    feelings: [String],
    note: { type: String, trim: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: toJSONOptions },
);

const specialistSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: [true, "Укажите имя специалиста"], trim: true, maxlength: 80 },
    title: { type: String, trim: true, maxlength: 80 },
    experienceYears: { type: Number, min: 0, max: 60 },
    education: { type: String, trim: true, maxlength: 300 },
    approach: { type: String, trim: true, maxlength: 120 },
    about: { type: String, trim: true, maxlength: 2000 },
    topics: [String],
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email обязателен"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Некорректный email"],
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "psychologist", "admin"], default: "user", index: true },
    active: { type: Boolean, default: true },
    profile: { type: profileSchema, default: () => ({}) },
    specialist: { type: specialistSchema, default: undefined },
    testResults: [testResultSchema],
    moods: [moodSchema],
  },
  { timestamps: true, toJSON: toJSONOptions },
);

userSchema.index({ "profile.city": 1 });

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this.id,
    email: this.email,
    nickname: this.profile?.nickname,
    profile: this.profile,
    specialist: this.specialist,
    role: this.role,
    active: this.active,
    createdAt: this.createdAt,
  };
};

userSchema.methods.toSpecialistCard = function toSpecialistCard() {
  return { id: this.id, ...(this.specialist?.toObject?.() || this.specialist || {}) };
};

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

module.exports = mongoose.model("User", userSchema);
