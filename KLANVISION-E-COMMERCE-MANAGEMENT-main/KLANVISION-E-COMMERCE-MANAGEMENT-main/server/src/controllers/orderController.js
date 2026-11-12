const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Product = require('../models/Product');

const transitions = { Placed: ['Processing'], Processing: ['Shipped'], Shipped: ['Delivered'], Delivered: [], Cancelled: [] };

exports.list = async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { customer: req.user.customer };
  const orders = await Order.find(filter).populate('customer', 'name email').sort({ createdAt: -1 });
  res.json({ success: true, data: orders });
};

exports.get = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer');
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  if (req.user.role !== 'admin' && order.customer.user?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'This order belongs to another customer' });
  }
  res.json({ success: true, data: order });
};

exports.create = async (req, res) => {
  const { customerId, cartCustomerId = customerId } = req.body;
  if (!mongoose.isValidObjectId(customerId)) return res.status(400).json({ success: false, error: 'A valid customerId is required' });
  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  if (req.user.role !== 'admin' && customer.user?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'You can only place orders for your own customer profile' });
  }
  if (req.user.role !== 'admin' && cartCustomerId !== customerId) {
    return res.status(403).json({ success: false, error: 'You can only use your own cart at checkout' });
  }
  const cart = await Cart.findOneAndUpdate(
    { customer: cartCustomerId, checkoutLock: { $ne: true }, 'items.0': { $exists: true } },
    { $set: { checkoutLock: true } },
    { new: true }
  );
  if (!cart) {
    const existingCart = await Cart.findOne({ customer: cartCustomerId });
    if (existingCart?.checkoutLock) return res.status(409).json({ success: false, error: 'This cart is already being checked out' });
    return res.status(400).json({ success: false, error: 'Your cart is empty' });
  }

  const reserved = [];
  let createdOrder;
  let originalCartItems;
  try {
    await cart.populate('items.product');
    originalCartItems = cart.items.map(({ product, quantity }) => ({
      product: product?._id || product,
      quantity
    }));
    const items = [];
    let totalAmount = 0;
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product) throw Object.assign(new Error('A cart product no longer exists'), { status: 400 });
      if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) throw Object.assign(new Error('Cart contains an invalid quantity'), { status: 400 });
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, quantity: { $gte: cartItem.quantity } },
        { $inc: { quantity: -cartItem.quantity } },
        { new: true }
      );
      if (!updated) throw Object.assign(new Error(`${product.name} does not have enough stock`), { status: 409 });
      reserved.push({ productId: product._id, quantity: cartItem.quantity });
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        imageUrl: product.imageUrl || ''
      });
      totalAmount += product.price * cartItem.quantity;
    }

    createdOrder = await Order.create({ customer: customerId, items, totalAmount: Number(totalAmount.toFixed(2)) });
    cart.items = [];
    cart.checkoutLock = false;
    await cart.save();
    await createdOrder.populate('customer', 'name email');
    return res.status(201).json({ success: true, data: createdOrder, message: 'Order placed successfully' });
  } catch (error) {
    if (createdOrder) {
      const deletion = await Order.deleteOne({ _id: createdOrder._id });
      if (deletion.deletedCount !== 1) throw new Error('Order placement failed and the incomplete order could not be removed');
    }
    const rollback = await Promise.all(reserved.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { quantity } })
    ));
    const cartRollback = await Cart.updateOne(
      { _id: cart._id },
      { $set: { items: originalCartItems || cart.items, checkoutLock: false } }
    );
    if (rollback.some((result) => result.matchedCount !== 1) || cartRollback.matchedCount !== 1) {
      throw new Error('Order placement failed and inventory rollback was incomplete');
    }
    throw error;
  }
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!Order.statuses.includes(status) || status === 'Cancelled') {
    return res.status(400).json({ success: false, error: 'Use the cancel endpoint to cancel an order; status updates must follow fulfillment steps' });
  }
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  if (!transitions[order.status].includes(status)) {
    return res.status(409).json({ success: false, error: `Cannot change order from ${order.status} to ${status}` });
  }
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status } },
    { new: true }
  );
  if (!updated) return res.status(409).json({ success: false, error: 'Order status changed; reload and try again' });
  await updated.populate('customer', 'name email');
  res.json({ success: true, data: updated, message: `Order marked ${status.toLowerCase()}` });
};

exports.cancel = async (req, res) => {
  const existing = await Order.findById(req.params.id).populate('customer');
  if (!existing) return res.status(404).json({ success: false, error: 'Order not found' });
  if (req.user.role !== 'admin' && existing.customer?.user?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: 'You can only cancel your own orders' });
  }
  const cancellableStatuses = req.user.role === 'admin' ? ['Placed', 'Processing', 'Shipped'] : ['Placed', 'Processing'];
  if (!cancellableStatuses.includes(existing.status)) {
    return res.status(409).json({ success: false, error: `A ${existing.status} order cannot be cancelled` });
  }
  const order = await Order.findOneAndUpdate(
    { _id: existing._id, status: existing.status },
    { $set: { status: 'Cancelled' } },
    { new: true }
  );
  if (!order) return res.status(409).json({ success: false, error: 'Order status changed; reload and try again' });
  const restored = [];
  for (const { product, quantity } of order.items) {
    const result = await Product.updateOne({ _id: product }, { $inc: { quantity } });
    if (result.matchedCount !== 1) {
      const rollback = await Promise.all(restored.map((item) =>
        Product.updateOne({ _id: item.product }, { $inc: { quantity: -item.quantity } })
      ));
      if (rollback.some((item) => item.matchedCount !== 1)) {
        throw new Error('Inventory restoration failed and could not be fully rolled back; order remains cancelled');
      }
      const reverted = await Order.updateOne(
        { _id: order._id, status: 'Cancelled' },
        { $set: { status: existing.status } }
      );
      if (reverted.matchedCount !== 1) throw new Error('Inventory restoration failed and order cancellation could not be reverted');
      throw new Error('Could not restore all inventory for this order; cancellation was reverted');
    }
    restored.push({ product, quantity });
  }
  await order.populate('customer', 'name email');
  res.json({ success: true, data: order, message: 'Order cancelled and stock restored' });
};
