const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/orderController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();
router.use(authenticate);
router.get('/', asyncHandler(controller.list));
router.post(
  '/',
  body('customerId').isMongoId().withMessage('A valid customerId is required'),
  body('cartCustomerId').optional().isMongoId().withMessage('A valid cartCustomerId is required'),
  validate,
  asyncHandler(controller.create)
);
router.get('/:id', asyncHandler(controller.get));
router.patch('/:id/status', authorize('admin'), body('status').isIn(['Placed', 'Processing', 'Shipped', 'Delivered']).withMessage('Invalid fulfillment status'), validate, asyncHandler(controller.updateStatus));
router.post('/:id/cancel', asyncHandler(controller.cancel));
module.exports = router;
