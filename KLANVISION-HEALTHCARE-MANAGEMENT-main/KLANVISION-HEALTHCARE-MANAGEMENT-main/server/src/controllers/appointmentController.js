const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const asyncHandler = require("../utils/asyncHandler");
const { parseAppointmentDate, isPastAppointment } = require("../utils/dates");

function handleSlotConflict(error, res) {
  if (error.code === 11000) {
    return res.status(409).json({ message: "This doctor already has an appointment in that time slot." });
  }
  throw error;
}

async function getPatientProfile(userId) {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    const error = new Error("Patient profile not found.");
    error.status = 404;
    throw error;
  }
  return patient;
}

async function validateSlot(doctorId, dateValue, timeSlot) {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const error = new Error("Doctor not found.");
    error.status = 404;
    throw error;
  }
  if (!doctor.availableTimeSlots.includes(timeSlot)) {
    const error = new Error("The selected time slot is not available for this doctor.");
    error.status = 400;
    throw error;
  }
  const date = parseAppointmentDate(dateValue);
  if (!date) {
    const error = new Error("Date must be a valid date in YYYY-MM-DD format.");
    error.status = 400;
    throw error;
  }
  if (isPastAppointment(date, timeSlot)) {
    const error = new Error("Appointments cannot be booked in the past.");
    error.status = 400;
    throw error;
  }
  return { doctor, date };
}

function populateAppointment(query) {
  return query
    .populate({ path: "patient", populate: { path: "user", select: "name email" } })
    .populate({ path: "doctor", populate: { path: "user", select: "name email" } });
}

const bookAppointment = asyncHandler(async (req, res) => {
  const patient = await getPatientProfile(req.user.id);
  const { doctor, date } = await validateSlot(req.body.doctorId, req.body.date, req.body.timeSlot);
  try {
    const appointment = await Appointment.create({
      patient: patient.id,
      doctor: doctor.id,
      date,
      timeSlot: req.body.timeSlot,
      reason: req.body.reason || "",
    });
    const populatedAppointment = await populateAppointment(Appointment.findById(appointment.id));
    return res.status(201).json(populatedAppointment);
  } catch (error) {
    return handleSlotConflict(error, res);
  }
});

const listAppointments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === "patient") {
    const patient = await getPatientProfile(req.user.id);
    filter.patient = patient.id;
  } else if (req.user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found." });
    filter.doctor = doctor.id;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.period === "upcoming") {
    filter.date = { $gte: new Date(new Date().toISOString().slice(0, 10)) };
    filter.status = { $in: ["Scheduled", "Rescheduled"] };
  } else if (req.query.period === "previous") {
    filter.$or = [
      { date: { $lt: new Date(new Date().toISOString().slice(0, 10)) } },
      { status: { $in: ["Completed", "Cancelled"] } },
    ];
  }
  const appointments = await populateAppointment(
    Appointment.find(filter).sort({ date: 1, timeSlot: 1 })
  );
  return res.json(appointments);
});

const appointmentHistory = asyncHandler(async (req, res) => {
  const filter = { status: { $in: ["Completed", "Cancelled"] } };
  if (req.user.role === "patient") {
    filter.patient = (await getPatientProfile(req.user.id)).id;
  } else if (req.user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found." });
    filter.doctor = doctor.id;
  }
  return res.json(await populateAppointment(Appointment.find(filter).sort({ date: -1, timeSlot: -1 })));
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const patient = await getPatientProfile(req.user.id);
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: patient.id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });
  if (!["Scheduled", "Rescheduled"].includes(appointment.status)) {
    return res.status(400).json({ message: "Only active appointments can be cancelled." });
  }
  appointment.status = "Cancelled";
  await appointment.save();
  return res.json(await populateAppointment(Appointment.findById(appointment.id)));
});

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const patient = await getPatientProfile(req.user.id);
  const appointment = await Appointment.findOne({ _id: req.params.id, patient: patient.id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });
  if (!["Scheduled", "Rescheduled"].includes(appointment.status)) {
    return res.status(400).json({ message: "Only active appointments can be rescheduled." });
  }
  await validateSlot(appointment.doctor, req.body.date, req.body.timeSlot);
  appointment.date = parseAppointmentDate(req.body.date);
  appointment.timeSlot = req.body.timeSlot;
  appointment.status = "Rescheduled";
  try {
    await appointment.save();
    return res.json(await populateAppointment(Appointment.findById(appointment.id)));
  } catch (error) {
    return handleSlotConflict(error, res);
  }
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) return res.status(404).json({ message: "Doctor profile not found." });
  const appointment = await Appointment.findOne({ _id: req.params.id, doctor: doctor.id });
  if (!appointment) return res.status(404).json({ message: "Appointment not found." });
  if (!["Scheduled", "Rescheduled"].includes(appointment.status)) {
    return res.status(400).json({ message: "Only active appointments can be marked completed." });
  }
  appointment.status = "Completed";
  await appointment.save();
  return res.json(await populateAppointment(Appointment.findById(appointment.id)));
});

module.exports = {
  bookAppointment,
  listAppointments,
  appointmentHistory,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
};
