const express = require('express');
const controller = require('../controllers/cartController');
const asyncHandler = require('../middleware/asyncHandler');
const authenticate = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);
router.get('/', asyncHandler(controller.get));
router.post('/items', asyncHandler(controller.add));
router.put('/items/:productId', asyncHandler(controller.update));
router.delete('/items/:productId', asyncHandler(controller.remove));
module.exports = router;
