const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
