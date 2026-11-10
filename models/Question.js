const mongoose = require("mongoose");
const { toJSONOptions, refId } = require("./toJSON");

// Сообщение переписки — вложенный документ. Вся переписка читается одним
// запросом вместе с обращением (в PostgreSQL — таблица Messages + JOIN)
const messageSchema = new mongoose.Schema(
  {
    authorRole: { type: String, enum: ["user", "psychologist"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: toJSONOptions },
);

const questionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: ["open", "answered", "closed"], default: "open" },
    // Психолог, который взял обращение. null — обращение в общей очереди
    psychologist: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    messages: [messageSchema],
  },
  { timestamps: true, toJSON: toJSONOptions },
);

// id автора строкой — независимо от того, выполнен ли populate
questionSchema.virtual("userId").get(function userId() {
  return refId(this.user);
});

questionSchema.virtual("psychologistId").get(function psychologistId() {
  return refId(this.psychologist);
});

questionSchema.methods.isOwnedBy = function isOwnedBy(id) {
  return refId(this.user) === String(id);
};

// Читать обращение может автор, психолог, который его ведёт, и любой психолог,
// пока обращение в очереди. Администратор переписку не видит — она конфиденциальна
questionSchema.methods.canAccess = function canAccess(user) {
  if (this.isOwnedBy(user.id)) return true;
  if (user.role !== "psychologist") return false;
  return !this.psychologist || refId(this.psychologist) === String(user.id);
};

module.exports = mongoose.model("Question", questionSchema);
