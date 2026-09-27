import 'dotenv/config';
import Fastify from 'fastify';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const { Pool } = pg;
const origin = process.env.CLIENT_ORIGIN;
if (!process.env.DATABASE_URL || !origin) throw new Error('DATABASE_URL and CLIENT_ORIGIN are required');
const app = Fastify({ bodyLimit: 2 * 1024 * 1024 });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', origin);
  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Allow-Headers', 'Content-Type');
  reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  reply.header('Vary', 'Origin');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin !== origin) {
    return reply.code(403).send();
  }
});
app.options('/*', async (request, reply) => reply.code(204).send());
const fail = (reply, status, message) => reply.code(status).send({ error: message });
const hash = token => createHash('sha256').update(token).digest('hex');
const cookie = request => (request.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith('notely_session='))?.split('=')[1];
const cookieOptions = () => `HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 30}${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`;
async function issueSession(reply, user) {
  const token = randomBytes(32).toString('hex');
  await pool.query('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,now() + interval \'30 days\')', [hash(token), user.id]);
  reply.header('Set-Cookie', `notely_session=${token}; ${cookieOptions()}`);
  return { id: user.id, email: user.email };
}
async function auth(request, reply) {
  const token = cookie(request);
  if (!token) return fail(reply, 401, 'Sign in required');
  const { rows } = await pool.query('SELECT users.id, users.email FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash=$1 AND expires_at > now()', [hash(token)]);
  if (!rows.length) return fail(reply, 401, 'Session expired');
  request.user = rows[0];
}
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const date = value => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const validTag = t => t && uuid(t.id) && typeof t.name === 'string' && t.name.trim().length >= 1 && t.name.length <= 100 && Number.isInteger(t.color) && t.color >= 0 && t.color <= 8 && typeof t.active === 'boolean' && date(t.createdAt) && date(t.updatedAt);
const validNote = n => n && uuid(n.id) && typeof n.title === 'string' && n.title.trim().length >= 1 && n.title.length <= 200 && typeof n.content === 'string' && n.content.trim().length >= 1 && n.content.length <= 100000 && Array.isArray(n.tags) && n.tags.every(uuid) && typeof n.active === 'boolean' && date(n.createdAt) && date(n.updatedAt);
const mapNote = row => ({ id: row.id, title: row.title, content: row.content, tags: row.tags, active: row.active, createdAt: row.created_at, updatedAt: row.updated_at });
const mapTag = row => ({ id: row.id, name: row.name, color: row.color, active: row.active, createdAt: row.created_at, updatedAt: row.updated_at });
async function data(userId, db = pool) {
  const [notes, tags] = await Promise.all([
    db.query('SELECT * FROM notes WHERE user_id=$1 ORDER BY created_at', [userId]),
    db.query('SELECT * FROM tags WHERE user_id=$1 ORDER BY created_at', [userId]),
  ]);
  return { notes: notes.rows.map(mapNote), tags: tags.rows.map(mapTag) };
}
async function saveNote(db, userId, n) {
  await db.query(`INSERT INTO notes (id,user_id,title,content,tags,active,created_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,content=EXCLUDED.content,tags=EXCLUDED.tags,active=EXCLUDED.active,updated_at=EXCLUDED.updated_at
    WHERE notes.user_id=EXCLUDED.user_id`, [n.id,userId,n.title,n.content,n.tags,n.active,n.createdAt,n.updatedAt]);
}
async function saveTag(db, userId, t) {
  await db.query(`INSERT INTO tags (id,user_id,name,color,active,created_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,color=EXCLUDED.color,active=EXCLUDED.active,updated_at=EXCLUDED.updated_at
    WHERE tags.user_id=EXCLUDED.user_id`, [t.id,userId,t.name,t.color,t.active,t.createdAt,t.updatedAt]);
}
app.get('/health', async () => {
  await pool.query('SELECT 1');
  return { ok: true };
});
app.post('/auth/register', async (request, reply) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = request.body?.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return fail(reply, 400, 'Enter a valid email and a password of 8–72 characters');
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query('INSERT INTO users (id,email,password_hash) VALUES ($1,$2,$3) RETURNING id,email', [randomUUID(), email, passwordHash]);
    return reply.code(201).send({ user: await issueSession(reply, rows[0]) });
  } catch (error) {
    if (error.code === '23505') return fail(reply, 409, 'Email already registered');
    throw error;
  }
});
app.post('/auth/login', async (request, reply) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = request.body?.password;
  if (!email || typeof password !== 'string') return fail(reply, 400, 'Email and password required');
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) return fail(reply, 401, 'Invalid email or password');
  return { user: await issueSession(reply, rows[0]) };
});
app.get('/auth/me', { preHandler: auth }, async request => ({ user: request.user }));
app.post('/auth/logout', { preHandler: auth }, async (request, reply) => {
  await pool.query('DELETE FROM sessions WHERE token_hash=$1', [hash(cookie(request))]);
  reply.header('Set-Cookie', 'notely_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  return reply.code(204).send();
});
app.get('/data', { preHandler: auth }, async request => data(request.user.id));
app.post('/data/import', { preHandler: auth }, async (request, reply) => {
  const { notes, tags } = request.body || {};
  if (!Array.isArray(notes) || !Array.isArray(tags) || notes.length > 1000 || tags.length > 1000 || !notes.every(validNote) || !tags.every(validTag)) {
    return fail(reply, 400, 'Invalid notes or tags');
  }
  const db = await pool.connect();
  try {
    await db.query('BEGIN');
    for (const tag of tags) await saveTag(db, request.user.id, tag);
    for (const note of notes) await saveNote(db, request.user.id, note);
    await db.query('COMMIT');
  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
  return data(request.user.id);
});
for (const [kind, valid, save] of [['notes', validNote, saveNote], ['tags', validTag, saveTag]]) {
  app.put(`/data/${kind}/:id`, { preHandler: auth }, async (request, reply) => {
    if (request.params.id !== request.body?.id || !valid(request.body)) return fail(reply, 400, 'Invalid item');
    await save(pool, request.user.id, request.body);
    return request.body;
  });
  app.delete(`/data/${kind}/:id`, { preHandler: auth }, async (request, reply) => {
    if (!uuid(request.params.id)) return fail(reply, 400, 'Invalid id');
    await pool.query(`DELETE FROM ${kind} WHERE id=$1 AND user_id=$2`, [request.params.id, request.user.id]);
    return reply.code(204).send();
  });
}
app.setErrorHandler((error, request, reply) => {
  if (error.statusCode && error.statusCode < 500) return fail(reply, error.statusCode, error.message);
  app.log.error(error);
  return fail(reply, 500, 'Server error');
});
app.addHook('onClose', async () => pool.end());
await pool.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
await app.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' });
