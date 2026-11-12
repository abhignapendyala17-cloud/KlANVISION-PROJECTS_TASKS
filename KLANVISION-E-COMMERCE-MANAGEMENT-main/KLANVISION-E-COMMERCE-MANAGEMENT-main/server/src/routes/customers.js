const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/customerController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();
const customerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must contain exactly 10 digits'),
  body('address').trim().notEmpty().withMessage('Delivery address is required')
];

router.use(authenticate);
router.get('/', asyncHandler(controller.list));
router.post('/', authorize('admin'), customerRules, validate, asyncHandler(controller.create));
router.put('/:id', authorize('admin'), customerRules, validate, asyncHandler(controller.update));
router.delete('/:id', authorize('admin'), asyncHandler(controller.remove));
module.exports = router;
