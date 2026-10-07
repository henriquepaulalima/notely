import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { ORIGIN, send } from './helpers.js';

// These tests need no database: the pool fails or is never reached.
const failingPool = { query: async () => { throw new Error('connection refused at 10.0.0.5'); } };

test('server errors hide their details', async t => {
  const app = await buildApp({ pool: failingPool, origin: ORIGIN, logger: false });
  t.after(() => app.close());

  const response = await send(app, 'GET', '/health');

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json(), { error: 'Server error' });
});

test('responses carry CORS headers for the client origin and are not cached', async t => {
  const app = await buildApp({ pool: failingPool, origin: ORIGIN, logger: false });
  t.after(() => app.close());

  const response = await send(app, 'OPTIONS', '/data');

  assert.equal(response.statusCode, 204);
  assert.equal(response.headers['access-control-allow-origin'], ORIGIN);
  assert.equal(response.headers['access-control-allow-credentials'], 'true');
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('writes from another origin or without an origin are rejected', async t => {
  const app = await buildApp({ pool: failingPool, origin: ORIGIN, logger: false });
  t.after(() => app.close());

  for (const origin of ['https://evil.test', null]) {
    const response = await send(app, 'POST', '/auth/login', { origin, body: { email: 'a@b.co', password: 'password1' } });
    assert.equal(response.statusCode, 403);
  }
});

test('protected routes require a session cookie', async t => {
  const app = await buildApp({ pool: failingPool, origin: ORIGIN, logger: false });
  t.after(() => app.close());

  const response = await send(app, 'GET', '/data');

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { error: 'Sign in required' });
});

test('requests are rate limited per X-Real-IP address', async t => {
  const app = await buildApp({ pool: { query: async () => ({ rows: [] }) }, origin: ORIGIN, logger: false });
  t.after(() => app.close());

  for (let i = 0; i < 120; i++) await send(app, 'GET', '/health', { ip: '10.9.9.9' });
  const limited = await send(app, 'GET', '/health', { ip: '10.9.9.9' });
  const other = await send(app, 'GET', '/health', { ip: '10.9.9.10' });

  assert.equal(limited.statusCode, 429);
  assert.match(limited.json().error, /Rate limit exceeded/);
  assert.equal(other.statusCode, 200);
});

test('invalid registration input is rejected before touching the database', async t => {
  const app = await buildApp({ pool: failingPool, origin: ORIGIN, logger: false });
  t.after(() => app.close());

  const response = await send(app, 'POST', '/auth/register', { body: { email: 'nope', password: 'password1' } });

  assert.equal(response.statusCode, 400);
});
