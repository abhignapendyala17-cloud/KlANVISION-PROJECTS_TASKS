require('../src/config/loadEnv');

const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');

const hasConfiguredMongoUri = Boolean(
  /^mongodb(?:\+srv)?:\/\//.test(process.env.MONGO_URI || '') &&
  !/DB_USER|DB_PASSWORD|xxxxx|cluster-host|<.*>/.test(process.env.MONGO_URI)
);
const configuredJwtSecret = process.env.JWT_SECRET;
const timestamp = Date.now();
const userEmail = `db-smoke-user-${timestamp}@example.test`;
const adminEmail = `db-smoke-admin-${timestamp}@example.test`;
const password = `Smoke-${require('crypto').randomBytes(20).toString('hex')}-9`;
const productId = `DB-SMOKE-${timestamp}`;
const testCustomerIds = [];
let testUserId;
let testAdminId;
let testProductObjectId;
let server;
let baseUrl;
let userToken;
let adminToken;
let customerId;
let createdOrderId;

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const result = await response.json();
  return { status: response.status, ...result };
}

before(async (context) => {
  if (!hasConfiguredMongoUri || !configuredJwtSecret || configuredJwtSecret.length < 32) {
    context.skip('A MongoDB URI and JWT_SECRET are required; no database test data was written');
    return;
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 12000 });
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  const admin = await User.create({
    name: 'Temporary Database Smoke Admin',
    email: adminEmail,
    passwordHash: await bcrypt.hash(password, 4),
    role: 'admin'
  });
  testAdminId = admin._id;
});

after(async () => {
  if (testAdminId || testUserId) {
    if (testAdminId) await User.deleteOne({ _id: testAdminId });
    if (testUserId) {
      await Cart.deleteMany({ customer: { $in: testCustomerIds } });
      await Order.deleteMany({ customer: { $in: testCustomerIds } });
      await User.deleteOne({ _id: testUserId });
      await Customer.deleteMany({ _id: { $in: testCustomerIds } });
    }
    if (testProductObjectId) await Product.deleteOne({ _id: testProductObjectId });
    else await Product.deleteOne({ productId });
  }
  if (server) {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
});

test('register and login persist a customer account in MongoDB', async () => {
  const registered = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Temporary Database Smoke User',
      email: userEmail,
      password,
      phone: '5551234567',
      address: '100 Integration Test Lane'
    }
  });
  assert.equal(registered.status, 201, registered.error);
  assert.equal(registered.data.user.role, 'user');
  userToken = registered.data.token;
  testUserId = registered.data.user._id;
  customerId = registered.data.user.customerId;
  testCustomerIds.push(customerId);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: userEmail, password }
  });
  assert.equal(login.status, 200, login.error);
  userToken = login.data.token;

  const profile = await request('/api/auth/me', { token: userToken });
  assert.equal(profile.status, 200);
  assert.equal(profile.data.customerId, customerId);
});

test('admin can create a product and customer can add it to a persistent cart', async () => {
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: adminEmail, password }
  });
  assert.equal(adminLogin.status, 200, adminLogin.error);
  adminToken = adminLogin.data.token;

  const created = await request('/api/products', {
    method: 'POST',
    token: adminToken,
    body: { productId, name: 'Temporary database smoke product', category: 'Testing', price: 12.5, quantity: 5, description: 'Removed after the integration test.', imageUrl: 'https://example.test/smoke-product.jpg' }
  });
  assert.equal(created.status, 201, created.error);
  testProductObjectId = created.data._id;

  const customerList = await request('/api/customers', { token: userToken });
  assert.equal(customerList.status, 200);
  assert.deepEqual(customerList.data.map((item) => item._id), [customerId]);

  const added = await request('/api/cart/items', {
    method: 'POST',
    token: userToken,
    body: { customerId, productId: testProductObjectId, quantity: 2 }
  });
  assert.equal(added.status, 200, added.error);
  assert.equal(added.data.items[0].quantity, 2);

  const cart = await request(`/api/cart?customerId=${customerId}`, { token: userToken });
  assert.equal(cart.status, 200);
  assert.equal(cart.data.items[0].quantity, 2);
});

test('customer checkout reserves stock and admin cancellation restores it', async () => {
  const placed = await request('/api/orders', {
    method: 'POST',
    token: userToken,
    body: { customerId }
  });
  assert.equal(placed.status, 201, placed.error);
  createdOrderId = placed.data._id;
  assert.equal(placed.data.totalAmount, 25);
  assert.equal(placed.data.items[0].imageUrl, 'https://example.test/smoke-product.jpg');

  let product = await request(`/api/products/${testProductObjectId}`);
  assert.equal(product.status, 200);
  assert.equal(product.data.quantity, 3);

  const ownOrder = await request(`/api/orders/${createdOrderId}`, { token: userToken });
  assert.equal(ownOrder.status, 200);
  const ownOrders = await request('/api/orders', { token: userToken });
  assert.equal(ownOrders.status, 200);
  assert.ok(ownOrders.data.some((order) => order._id === createdOrderId));

  const processing = await request(`/api/orders/${createdOrderId}/status`, {
    method: 'PATCH', token: adminToken, body: { status: 'Processing' }
  });
  assert.equal(processing.status, 200, processing.error);
  assert.equal(processing.data.status, 'Processing');

  const cancelled = await request(`/api/orders/${createdOrderId}/cancel`, {
    method: 'POST', token: adminToken
  });
  assert.equal(cancelled.status, 200, cancelled.error);
  assert.equal(cancelled.data.status, 'Cancelled');

  product = await request(`/api/products/${testProductObjectId}`);
  assert.equal(product.data.quantity, 5);
});
