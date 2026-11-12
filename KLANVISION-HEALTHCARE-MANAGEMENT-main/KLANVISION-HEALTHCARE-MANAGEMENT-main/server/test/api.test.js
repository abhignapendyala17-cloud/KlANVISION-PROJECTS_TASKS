const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("health endpoint reports the API and database readiness", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: "unavailable",
    server: "ok",
    database: "disconnected",
  });
});

test("registration rejects invalid fields before touching the database", async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "", email: "not-an-email", password: "short", phone: "123", age: 0 }),
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.message, "Please correct the highlighted fields.");
  assert.ok(body.errors.length >= 5);
});

test("protected doctor endpoint rejects unauthenticated requests", async () => {
  const response = await fetch(`${baseUrl}/api/doctors`);
  assert.equal(response.status, 401);
  assert.equal((await response.json()).message, "Authentication is required.");
});

test("unknown API routes return a clear 404", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(response.status, 404);
});
