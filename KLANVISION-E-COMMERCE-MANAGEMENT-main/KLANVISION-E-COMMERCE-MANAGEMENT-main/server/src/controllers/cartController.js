const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

async function customerAllowed(customerId, user) {
  if (user.role === 'admin') return true;
  return Boolean(user.customer && user.customer.toString() === customerId.toString());
}

async function getCart(customerId) {
  let cart = await Cart.findOne({ customer: customerId }).populate('items.product');
  if (!cart) cart = await Cart.create({ customer: customerId, items: [] });
  return cart;
}

exports.get = async (req, res) => {
  const { customerId } = req.query;
  if (!mongoose.isValidObjectId(customerId)) return res.status(400).json({ success: false, error: 'A valid customerId is required' });
  if (!await customerAllowed(customerId, req.user)) return res.status(403).json({ success: false, error: 'You can only access your own cart' });
  if (!await Customer.exists({ _id: customerId })) return res.status(404).json({ success: false, error: 'Customer not found' });
  res.json({ success: true, data: await getCart(customerId) });
};

exports.add = async (req, res) => {
  const { customerId, productId, quantity } = req.body;
  if (!mongoose.isValidObjectId(customerId) || !mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ success: false, error: 'Valid customerId and productId are required' });
  }
  if (!await customerAllowed(customerId, req.user)) return res.status(403).json({ success: false, error: 'You can only access your own cart' });
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, error: 'Quantity must be a positive integer' });
  if (!await Customer.exists({ _id: customerId })) return res.status(404).json({ success: false, error: 'Customer not found' });
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  if (await Cart.exists({ customer: customerId, checkoutLock: true })) {
    return res.status(409).json({ success: false, error: 'This cart is currently being checked out' });
  }
  const cart = await Cart.findOneAndUpdate(
    { customer: customerId },
    { $setOnInsert: { customer: customerId, items: [] } },
    { upsert: true, new: true }
  );
  const existing = cart.items.find((item) => item.product.toString() === productId);
  const nextQuantity = (existing ? existing.quantity : 0) + quantity;
  if (product.quantity < nextQuantity) return res.status(400).json({ success: false, error: 'Requested quantity exceeds available stock' });
  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: cart, message: 'Cart updated' });
};

exports.update = async (req, res) => {
  const { customerId, quantity } = req.body;
  if (!mongoose.isValidObjectId(customerId)) return res.status(400).json({ success: false, error: 'A valid customerId is required' });
  if (!await customerAllowed(customerId, req.user)) return res.status(403).json({ success: false, error: 'You can only access your own cart' });
  if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, error: 'Quantity must be a positive integer' });
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  if (quantity > product.quantity) return res.status(400).json({ success: false, error: 'Requested quantity exceeds available stock' });
  const cart = await Cart.findOne({ customer: customerId });
  if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });
  if (cart.checkoutLock) return res.status(409).json({ success: false, error: 'This cart is currently being checked out' });
  const item = cart.items.find((entry) => entry.product.toString() === req.params.productId);
  if (!item) return res.status(404).json({ success: false, error: 'Cart item not found' });
  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: cart, message: 'Cart quantity updated' });
};

exports.remove = async (req, res) => {
  const { customerId } = req.body;
  if (!mongoose.isValidObjectId(customerId)) return res.status(400).json({ success: false, error: 'A valid customerId is required' });
  if (!await customerAllowed(customerId, req.user)) return res.status(403).json({ success: false, error: 'You can only access your own cart' });
  const cart = await Cart.findOne({ customer: customerId });
  if (!cart) return res.status(404).json({ success: false, error: 'Cart not found' });
  if (cart.checkoutLock) return res.status(409).json({ success: false, error: 'This cart is currently being checked out' });
  cart.items = cart.items.filter((entry) => entry.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: cart, message: 'Item removed' });
};
