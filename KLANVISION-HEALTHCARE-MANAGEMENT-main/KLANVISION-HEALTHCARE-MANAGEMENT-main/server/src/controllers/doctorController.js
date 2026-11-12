const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const asyncHandler = require("../utils/asyncHandler");

const listDoctors = asyncHandler(async (req, res) => {
  const search = (req.query.q || "").trim();
  const filter = {};
  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matchingUsers = await User.find({
      role: "doctor",
      name: { $regex: safeSearch, $options: "i" },
    }).select("_id");
    filter.$or = [
      { user: { $in: matchingUsers.map((user) => user.id) } },
      { specialization: { $regex: safeSearch, $options: "i" } },
    ];
  }
  const doctors = await Doctor.find(filter).populate("user", "name email");
  return res.json(doctors);
});

const createDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, specialization, experience, contactInfo, availableTimeSlots } = req.body;
  const user = await User.create({ name, email, password, role: "doctor" });
  try {
    const doctor = await Doctor.create({
      user: user.id,
      specialization,
      experience,
      contactInfo,
      availableTimeSlots,
    });
    await doctor.populate("user", "name email");
    return res.status(201).json(doctor);
  } catch (error) {
    await User.findByIdAndDelete(user.id);
    throw error;
  }
});

const updateDoctor = asyncHandler(async (req, res) => {
  const { name, email, password, specialization, experience, contactInfo, availableTimeSlots } = req.body;
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: "Doctor not found." });
  const user = await User.findById(doctor.user);
  if (!user) return res.status(404).json({ message: "Doctor account not found." });

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (password) user.password = password;
  if (name !== undefined || email !== undefined || password) await user.save();

  for (const field of ["specialization", "experience", "contactInfo", "availableTimeSlots"]) {
    if (req.body[field] !== undefined) doctor[field] = req.body[field];
  }
  await doctor.save();
  await doctor.populate("user", "name email");
  return res.json(doctor);
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: "Doctor not found." });
  await Promise.all([
    Appointment.deleteMany({ doctor: doctor.id }),
    User.findByIdAndDelete(doctor.user),
    doctor.deleteOne(),
  ]);
  return res.json({ message: "Doctor and related appointments were deleted." });
});

module.exports = { listDoctors, createDoctor, updateDoctor, deleteDoctor };
