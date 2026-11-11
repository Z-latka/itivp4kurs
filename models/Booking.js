const mongoose = require("mongoose");
const { toJSONOptions } = require("./toJSON");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },
    psychologist: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    scheduledAt: { type: Date, required: [true, "Укажите дату и время"] },
    format: { type: String, enum: ["chat", "video", "audio"], default: "chat" },
    comment: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

module.exports = mongoose.model("Booking", bookingSchema);
