const Customer = require('../models/Customer');

exports.list = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: customers });
};

exports.create = async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(201).json({ success: true, data: customer, message: 'Customer registered' });
};

exports.update = async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true
  });
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  res.json({ success: true, data: customer, message: 'Customer updated' });
};

exports.remove = async (req, res) => {
  const Cart = require('../models/Cart');
  const Order = require('../models/Order');
  const [hasCart, hasOrder] = await Promise.all([
    Cart.exists({ customer: req.params.id }),
    Order.exists({ customer: req.params.id })
  ]);
  if (hasCart || hasOrder) return res.status(409).json({ success: false, error: 'Customers with carts or order history cannot be deleted' });
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  res.json({ success: true, message: 'Customer deleted' });
};
