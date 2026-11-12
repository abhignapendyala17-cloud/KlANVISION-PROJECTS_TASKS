const Product = require('../models/Product');

exports.list = async (req, res) => {
  const { search = '', category = '' } = req.query;
  const filter = {};
  if (search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { category: regex }, { productId: regex }];
  }
  if (category.trim() && category !== 'All categories') filter.category = category;
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: products });
};

exports.get = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product });
};

exports.create = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product, message: 'Product created' });
};

exports.update = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true
  });
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product, message: 'Product updated' });
};

exports.remove = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  const Cart = require('../models/Cart');
  const Order = require('../models/Order');
  const [inCart, inOrder] = await Promise.all([
    Cart.exists({ 'items.product': product._id }),
    Order.exists({ 'items.product': product._id })
  ]);
  if (inCart || inOrder) {
    return res.status(409).json({ success: false, error: 'Remove this product from carts and order history before deleting it' });
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
};
