const Patient = require("../models/Patient");
const asyncHandler = require("../utils/asyncHandler");

const listPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  return res.json(patients);
});

const getMyPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user.id }).populate("user", "name email");
  if (!patient) return res.status(404).json({ message: "Patient profile not found." });
  return res.json(patient);
});

module.exports = { listPatients, getMyPatient };
