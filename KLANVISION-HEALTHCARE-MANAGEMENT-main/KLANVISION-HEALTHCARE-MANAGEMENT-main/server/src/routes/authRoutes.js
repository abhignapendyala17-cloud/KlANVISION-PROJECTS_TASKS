const express = require("express");
const { body } = require("express-validator");
const { register, login, me, logout } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const validate = require("../middleware/validate");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required.").isLength({ max: 100 }),
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
    body("role").not().exists().withMessage("Account role is assigned by the system."),
    body("phone").matches(/^\d{10}$/).withMessage("Phone must contain exactly 10 digits."),
    body("age").isInt({ min: 1, max: 120 }).withMessage("Age must be between 1 and 120."),
    body("gender").isIn(["Female", "Male", "Non-binary", "Prefer not to say"]).withMessage("Select a valid gender."),
  ],
  validate,
  asyncHandler(register)
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Enter a valid email address."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  asyncHandler(login)
);
router.get("/me", authenticate, asyncHandler(me));
router.post("/logout", authenticate, asyncHandler(logout));

module.exports = router;
