const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: { type: String, required: true, trim: true, maxlength: 100 },
    experience: { type: Number, required: true, min: 0, max: 80 },
    contactInfo: {
      phone: { type: String, required: true, match: /^\d{10}$/ },
      address: { type: String, trim: true, maxlength: 200, default: "" },
    },
    availableTimeSlots: {
      type: [{ type: String, trim: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }],
      default: [],
    },
  },
  { timestamps: true }
);

doctorSchema.index({ specialization: 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
