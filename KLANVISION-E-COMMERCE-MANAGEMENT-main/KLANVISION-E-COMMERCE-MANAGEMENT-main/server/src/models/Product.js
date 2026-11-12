const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0.01 },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  imageUrl: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
