const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');

const router = express.Router();
const email = body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail();
router.post(
  '/register',
  body('name').trim().notEmpty().withMessage('Name is required'),
  email,
  body('password').isString().isLength({ min: 10 }).withMessage('Password must be at least 10 characters'),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must contain exactly 10 digits'),
  body('address').trim().notEmpty().withMessage('Delivery address is required'),
  validate,
  asyncHandler(controller.register)
);
router.post(
  '/login',
  email,
  body('password').isString().notEmpty().withMessage('Password is required'),
  validate,
  asyncHandler(controller.login)
);
router.get('/me', authenticate, asyncHandler(controller.me));

module.exports = router;
