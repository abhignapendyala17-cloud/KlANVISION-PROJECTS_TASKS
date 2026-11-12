const express = require("express");
const { body, param } = require("express-validator");
const {
  bookAppointment,
  listAppointments,
  appointmentHistory,
  cancelAppointment,
  rescheduleAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.use(authenticate);
router.get("/history", asyncHandler(appointmentHistory));
router.get("/", asyncHandler(listAppointments));
router.post(
  "/",
  authorize("patient"),
  [
    body("doctorId").isMongoId().withMessage("Select a valid doctor."),
    body("date").matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Date must use YYYY-MM-DD format."),
    body("timeSlot").matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Select a valid time slot."),
    body("reason").optional().trim().isLength({ max: 1000 }),
  ],
  validate,
  asyncHandler(bookAppointment)
);
router.patch(
  "/:id/cancel",
  authorize("patient"),
  param("id").isMongoId(),
  validate,
  asyncHandler(cancelAppointment)
);
router.patch(
  "/:id/reschedule",
  authorize("patient"),
  [
    param("id").isMongoId(),
    body("date").matches(/^\d{4}-\d{2}-\d{2}$/),
    body("timeSlot").matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  ],
  validate,
  asyncHandler(rescheduleAppointment)
);
router.patch(
  "/:id/status",
  authorize("doctor"),
  [
    param("id").isMongoId(),
    body("status").equals("Completed").withMessage("Doctors can mark appointments as Completed."),
  ],
  validate,
  asyncHandler(updateAppointmentStatus)
);

module.exports = router;
