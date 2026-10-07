import { after, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { deleteExpiredSessions } from '../src/app.js';
import { closePool, dbSkip, resetDatabase, send, sessionCookie, signUp, testApp, testPool } from './helpers.js';

describe('auth', { skip: dbSkip }, () => {
  let app;
  beforeEach(async () => {
    await resetDatabase();
    app = await testApp();
  });
  after(async () => {
    await app?.close();
    await closePool();
  });

  test('registering creates the user and a secure-capable session cookie', async () => {
    const { response, email } = await signUp(app, 'New@Notely.test ');

    assert.equal(response.statusCode, 201);
    assert.equal(response.json().user.email, email.trim().toLowerCase());
    assert.match(String(response.headers['set-cookie']), /^notely_session=[0-9a-f]{64}; HttpOnly; SameSite=Lax; Path=\/; Max-Age=2592000$/);
  });

  test('the session cookie is marked Secure when configured', async () => {
    const { buildApp } = await import('../src/app.js');
    const secureApp = await buildApp({ pool: await testPool(), origin: 'http://client.test', cookieSecure: true, logger: false });

    const { response } = await signUp(secureApp);
    await secureApp.close();

    assert.match(String(response.headers['set-cookie']), /; Secure$/);
  });

  test('registering an existing email returns 409', async () => {
    await signUp(app, 'taken@notely.test');

    const { response } = await signUp(app, 'taken@notely.test');

    assert.equal(response.statusCode, 409);
  });

  test('passwords are stored as bcrypt hashes', async () => {
    await signUp(app, 'hash@notely.test', 'password1');

    const { rows } = await (await testPool()).query('SELECT password_hash FROM users WHERE email=$1', ['hash@notely.test']);

    assert.match(rows[0].password_hash, /^\$2[aby]\$12\$/);
  });

  test('login accepts the right password and rejects a wrong one', async () => {
    const { email, password } = await signUp(app);

    const ok = await send(app, 'POST', '/auth/login', { body: { email, password } });
    const wrong = await send(app, 'POST', '/auth/login', { body: { email, password: 'wrong-password' } });
    const unknown = await send(app, 'POST', '/auth/login', { body: { email: 'nobody@notely.test', password } });

    assert.equal(ok.statusCode, 200);
    assert.equal(wrong.statusCode, 401);
    assert.equal(unknown.statusCode, 401);
    assert.deepEqual(wrong.json(), unknown.json(), 'unknown accounts are indistinguishable from wrong passwords');
  });

  test('me returns the signed-in user and logout ends the session', async () => {
    const { cookie, user } = await signUp(app);

    const me = await send(app, 'GET', '/auth/me', { cookie });
    const logout = await send(app, 'POST', '/auth/logout', { cookie });
    const afterLogout = await send(app, 'GET', '/auth/me', { cookie });

    assert.deepEqual(me.json(), { user });
    assert.equal(logout.statusCode, 204);
    assert.match(String(logout.headers['set-cookie']), /Max-Age=0/);
    assert.equal(afterLogout.statusCode, 401);
  });

  test('expired sessions are rejected and cleaned up', async () => {
    const { cookie } = await signUp(app);
    const pool = await testPool();
    await pool.query("UPDATE sessions SET expires_at = now() - interval '1 minute'");

    const response = await send(app, 'GET', '/auth/me', { cookie });
    await deleteExpiredSessions(pool);
    const { rows } = await pool.query('SELECT count(*)::int AS count FROM sessions');

    assert.equal(response.statusCode, 401);
    assert.equal(rows[0].count, 0);
  });

  test('a user keeps at most 10 sessions, dropping the oldest', async () => {
    const { email, password, cookie: firstCookie } = await signUp(app);
    const pool = await testPool();
    // Give each session a distinct expiry so "oldest" is well defined.
    for (let i = 0; i < 11; i++) {
      await pool.query("UPDATE sessions SET expires_at = expires_at - interval '1 second'");
      await send(app, 'POST', '/auth/login', { body: { email, password } });
    }

    const { rows } = await pool.query('SELECT count(*)::int AS count FROM sessions');
    const first = await send(app, 'GET', '/auth/me', { cookie: firstCookie });

    assert.equal(rows[0].count, 10);
    assert.equal(first.statusCode, 401);
  });

  test('sign-ups pause after 50 accounts in an hour', async () => {
    await (await testPool()).query("INSERT INTO users (id,email,password_hash) SELECT gen_random_uuid(), 'bulk' || g || '@notely.test', 'x' FROM generate_series(1, 50) g");

    const { response } = await signUp(app);

    assert.equal(response.statusCode, 503);
  });

  test('one address can register 5 accounts per hour', async () => {
    const codes = [];
    for (let i = 0; i < 6; i++) {
      const response = await send(app, 'POST', '/auth/register', { ip: '10.1.1.1', body: { email: `ip${i}@notely.test`, password: 'password1' } });
      codes.push(response.statusCode);
    }

    assert.deepEqual(codes, [201, 201, 201, 201, 201, 429]);
  });

  test('one account allows 10 login attempts per window even across addresses', async () => {
    const { email } = await signUp(app);
    const codes = [];
    for (let i = 0; i < 11; i++) {
      codes.push((await send(app, 'POST', '/auth/login', { body: { email, password: 'wrong-password' } })).statusCode);
    }

    assert.deepEqual(codes, [...Array(10).fill(401), 429]);
  });

  test('one address allows 30 login attempts per window across accounts', async () => {
    const codes = [];
    for (let i = 0; i < 31; i++) {
      codes.push((await send(app, 'POST', '/auth/login', { ip: '10.2.2.2', body: { email: `x${i}@notely.test`, password: 'password1' } })).statusCode);
    }

    assert.equal(codes.filter(code => code === 401).length, 30);
    assert.equal(codes.at(-1), 429);
  });

  test('sign-in issues a fresh cookie each time', async () => {
    const { email, password } = await signUp(app);

    const first = await send(app, 'POST', '/auth/login', { body: { email, password } });
    const second = await send(app, 'POST', '/auth/login', { body: { email, password } });

    assert.notEqual(sessionCookie(first), sessionCookie(second));
  });
});
