const mongoose = require('mongoose');

const statuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0.01 },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    imageUrl: { type: String, default: '', trim: true }
  }],
  totalAmount: { type: Number, required: true, min: 0.01 },
  status: { type: String, enum: statuses, default: 'Placed' }
}, { timestamps: true });

orderSchema.statics.statuses = statuses;
module.exports = mongoose.model('Order', orderSchema);
