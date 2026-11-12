const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const User = require('../models/User');

function issueToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h', issuer: 'ecommerce-inventory' }
  );
}

function safeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerId: user.customer ? user.customer.toString() : null
  };
}

exports.register = async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const normalizedEmail = email.toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  if (await Customer.exists({ email: normalizedEmail })) {
    return res.status(409).json({ success: false, error: 'A customer profile already uses this email; contact the store administrator to link it' });
  }
  const customer = new Customer({ name, email: normalizedEmail, phone, address });
  let user;
  try {
    user = await User.create({
      name, email: normalizedEmail, passwordHash, role: 'user', customer: customer._id
    });
    customer.user = user._id;
    customer.name = name;
    customer.phone = phone;
    customer.address = address;
    await customer.save();
    return res.status(201).json({
      success: true,
      data: { token: issueToken(user), user: safeUser(user) },
      message: 'Account created'
    });
  } catch (error) {
    if (user) await User.deleteOne({ _id: user._id });
    await Customer.deleteOne({ _id: customer._id });
    throw error;
  }
};

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ success: false, error: 'Email or password is incorrect' });
  }
  res.json({
    success: true,
    data: { token: issueToken(user), user: safeUser(user) },
    message: 'Signed in'
  });
};

exports.me = (req, res) => {
  res.json({ success: true, data: safeUser(req.user) });
};
