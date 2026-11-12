const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
  checkoutLock: { type: Boolean, default: false },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
