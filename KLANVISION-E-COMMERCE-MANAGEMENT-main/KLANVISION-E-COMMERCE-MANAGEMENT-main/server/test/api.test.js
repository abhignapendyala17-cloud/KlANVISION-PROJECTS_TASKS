const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Customer = require('../src/models/Customer');
const Order = require('../src/models/Order');

process.env.JWT_SECRET = 'test-only-secret-key-that-is-not-used-outside-the-test-suite';
const app = require('../src/app');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint returns the standard success response', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true, data: { status: 'ok' } });
});

test('CORS allows both supported Vite origins', async () => {
  for (const origin of ['http://localhost:5173', 'http://127.0.0.1:5173']) {
    const response = await fetch(`${baseUrl}/api/health`, { headers: { origin } });
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }
});

test('registration and login reject invalid requests before database access', async () => {
  const registration = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({})
  });
  assert.equal(registration.status, 400);
  assert.equal((await registration.json()).success, false);

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'invalid', password: '' })
  });
  assert.equal(login.status, 400);
  assert.equal((await login.json()).success, false);
});

test('registration and login routes return the expected auth response without database writes', async () => {
  const originalUserExists = User.exists;
  const originalCustomerExists = Customer.exists;
  const originalUserCreate = User.create;
  const originalCustomerSave = Customer.prototype.save;
  const originalUserFindOne = User.findOne;
  const password = 'Test-only-password-123';
  const passwordHash = await bcrypt.hash(password, 4);
  let createdUser;

  try {
    User.exists = async () => null;
    Customer.exists = async () => null;
    Customer.prototype.save = async function save() { return this; };
    User.create = async ({ name, email, role, customer }) => {
      createdUser = { _id: new mongoose.Types.ObjectId(), name, email, role, customer, passwordHash };
      return createdUser;
    };

    const registration = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: 'test-customer@example.test',
        password,
        phone: '5551234567',
        address: '100 Test Lane'
      })
    });
    const registered = await registration.json();
    assert.equal(registration.status, 201);
    assert.equal(registered.success, true);
    assert.equal(registered.data.user.role, 'user');
    assert.ok(registered.data.token);

    User.findOne = () => ({ select: async () => createdUser });
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test-customer@example.test', password })
    });
    const loggedIn = await login.json();
    assert.equal(login.status, 200);
    assert.equal(loggedIn.success, true);
    assert.equal(loggedIn.data.user.email, 'test-customer@example.test');
    assert.ok(loggedIn.data.token);
  } finally {
    User.exists = originalUserExists;
    Customer.exists = originalCustomerExists;
    User.create = originalUserCreate;
    Customer.prototype.save = originalCustomerSave;
    User.findOne = originalUserFindOne;
  }
});

test('protected APIs reject requests without a bearer token', async () => {
  for (const [path, method] of [
    ['/api/customers', 'GET'],
    ['/api/cart?customerId=507f1f77bcf86cd799439011', 'GET'],
    ['/api/orders', 'GET'],
    ['/api/orders', 'POST'],
    ['/api/products', 'POST']
  ]) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: method === 'POST' ? '{}' : undefined
    });
    assert.equal(response.status, 401, `${method} ${path}`);
    assert.equal((await response.json()).success, false);
  }
});

test('customer-role JWTs cannot use administrator APIs but can list their orders', async () => {
  const originalFindById = User.findById;
  const originalOrderFind = Order.find;
  const userId = '507f1f77bcf86cd799439011';
  User.findById = () => ({
    select: async () => ({
      _id: userId, name: 'Test Customer', email: 'user@example.com',
      role: 'user', customer: '507f1f77bcf86cd799439012'
    })
  });
  Order.find = () => ({
      populate() { return this; },
      sort: async () => []
  });
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { issuer: 'ecommerce-inventory', expiresIn: '1m' });
  try {
      for (const [path, method] of [
        ['/api/products', 'POST'],
        ['/api/customers', 'POST']
    ]) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: method === 'POST' ? '{}' : undefined
      });
      assert.equal(response.status, 403, `${method} ${path}`);
      assert.equal((await response.json()).success, false);
    }
    const orders = await fetch(`${baseUrl}/api/orders`, {
      headers: { authorization: 'Bearer ' + token }
    });
    assert.equal(orders.status, 200);
    assert.deepEqual((await orders.json()).data, []);
  } finally {
    User.findById = originalFindById;
    Order.find = originalOrderFind;
  }
});

test('customer-role JWTs can read only their own order details', async () => {
  const originalUserFindById = User.findById;
  const originalOrderFindById = Order.findById;
  const userId = '507f1f77bcf86cd799439011';
  const customerId = '507f1f77bcf86cd799439012';
  const otherCustomerId = '507f1f77bcf86cd799439013';
  const order = { _id: '507f1f77bcf86cd799439014', customer: { user: otherCustomerId } };
  User.findById = () => ({
    select: async () => ({
      _id: userId, name: 'Test Customer', email: 'user@example.com',
      role: 'user', customer: customerId
    })
  });
  Order.findById = () => ({ populate: async () => order });
  const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { issuer: 'ecommerce-inventory', expiresIn: '1m' });
  try {
    const denied = await fetch(`${baseUrl}/api/orders/${order._id}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(denied.status, 403);

    order.customer.user = userId;
    const allowed = await fetch(`${baseUrl}/api/orders/${order._id}`, {
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(allowed.status, 200);
    assert.equal((await allowed.json()).success, true);
  } finally {
    User.findById = originalUserFindById;
    Order.findById = originalOrderFindById;
  }
});
