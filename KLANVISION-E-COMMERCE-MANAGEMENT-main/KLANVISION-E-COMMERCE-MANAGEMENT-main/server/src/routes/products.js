const express = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/productController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');

const router = express.Router();
const productRules = [
  body('productId').trim().notEmpty().withMessage('Product ID is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than zero'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('imageUrl').optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage('Image URL must be a valid absolute URL'),
  body('description').optional().isString()
];

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.use(authenticate, authorize('admin'));
router.post('/', productRules, validate, asyncHandler(controller.create));
router.put('/:id', productRules, validate, asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));
module.exports = router;
