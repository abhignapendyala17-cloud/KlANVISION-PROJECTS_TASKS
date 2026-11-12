const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: { type: String, required: true, match: /^\d{10}$/ },
    age: { type: Number, required: true, min: 1, max: 120 },
    gender: {
      type: String,
      required: true,
      enum: ["Female", "Male", "Non-binary", "Prefer not to say"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
