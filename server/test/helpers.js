import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { buildApp, migrate } from '../src/app.js';

export const ORIGIN = 'http://client.test';
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl && process.env.CI) throw new Error('TEST_DATABASE_URL is required in CI');
// Database tests are skipped locally when no test database is configured.
export const dbSkip = databaseUrl ? false : 'set TEST_DATABASE_URL to run database tests';

let pool;
export async function testPool() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: databaseUrl });
    await migrate(pool);
  }
  return pool;
}
export async function closePool() {
  await pool?.end();
  pool = undefined;
}
export async function resetDatabase() {
  await (await testPool()).query('TRUNCATE users, sessions, notes, tags CASCADE');
}
export async function testApp() {
  return buildApp({ pool: await testPool(), origin: ORIGIN, logger: false });
}

let ipCounter = 0;
// A distinct address per call keeps per-address rate limits from interfering between requests.
export const freshIp = () => `10.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}.1`;
// Pass origin: null to send no Origin header.
export const send = (app, method, url, { body, cookie, ip = freshIp(), origin = ORIGIN, headers = {} } = {}) => app.inject({
  method,
  url,
  payload: body,
  headers: { 'x-real-ip': ip, ...(origin ? { origin } : {}), ...(cookie ? { cookie } : {}), ...headers },
});
export const sessionCookie = response => String(response.headers['set-cookie']).split(';')[0];
export async function signUp(app, email = `${randomUUID()}@notely.test`, password = 'password1') {
  const response = await send(app, 'POST', '/auth/register', { body: { email, password } });
  return { response, email, password, cookie: sessionCookie(response), user: response.json().user };
}

const now = () => new Date().toISOString();
export const note = (overrides = {}) => ({ id: randomUUID(), title: 'Title', content: 'Content', tags: [], active: true, createdAt: now(), updatedAt: now(), ...overrides });
export const tag = (overrides = {}) => ({ id: randomUUID(), name: 'Tag', color: 1, active: true, createdAt: now(), updatedAt: now(), ...overrides });
