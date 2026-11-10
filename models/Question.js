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
    messages: [messageSchema],
  },
  { timestamps: true, toJSON: toJSONOptions },
);

// id автора строкой — независимо от того, выполнен ли populate
questionSchema.virtual("userId").get(function userId() {
  return refId(this.user);
});

questionSchema.methods.isOwnedBy = function isOwnedBy(id) {
  return refId(this.user) === String(id);
};

module.exports = mongoose.model("Question", questionSchema);
