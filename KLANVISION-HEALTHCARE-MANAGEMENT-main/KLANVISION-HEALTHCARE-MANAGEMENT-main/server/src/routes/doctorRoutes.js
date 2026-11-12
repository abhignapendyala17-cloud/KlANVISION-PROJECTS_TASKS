const express = require("express");
const { body, param } = require("express-validator");
const { listDoctors, createDoctor, updateDoctor, deleteDoctor } = require("../controllers/doctorController");
const { authenticate, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

const doctorRules = [
  body("name").optional().trim().notEmpty().isLength({ max: 100 }),
  body("email").optional().trim().isEmail().withMessage("Enter a valid email address."),
  body("password").optional().isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  body("specialization").optional().trim().notEmpty().isLength({ max: 100 }),
  body("experience").optional().isInt({ min: 0, max: 80 }),
  body("contactInfo.phone").optional().matches(/^\d{10}$/).withMessage("Phone must contain exactly 10 digits."),
  body("contactInfo.address").optional().trim().isLength({ max: 200 }),
  body("availableTimeSlots").optional().isArray({ min: 1 }).withMessage("Add at least one available time slot."),
  body("availableTimeSlots.*").optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage("Slots must use 24-hour HH:MM format."),
];

router.get("/", authenticate, asyncHandler(listDoctors));
router.post(
  "/",
  authenticate,
  authorize("admin"),
  [
    body("name").trim().notEmpty().isLength({ max: 100 }),
    body("email").trim().isEmail(),
    body("password").isLength({ min: 8 }),
    body("specialization").trim().notEmpty().isLength({ max: 100 }),
    body("experience").isInt({ min: 0, max: 80 }),
    body("contactInfo.phone").matches(/^\d{10}$/),
    body("availableTimeSlots").isArray({ min: 1 }),
    body("availableTimeSlots.*").matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  ],
  validate,
  asyncHandler(createDoctor)
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  param("id").isMongoId(),
  ...doctorRules,
  validate,
  asyncHandler(updateDoctor)
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  param("id").isMongoId(),
  validate,
  asyncHandler(deleteDoctor)
);

module.exports = router;
