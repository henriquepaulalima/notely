import 'dotenv/config';
import pg from 'pg';
import { buildApp, deleteExpiredSessions, migrate } from './app.js';

const { Pool } = pg;
const origin = process.env.CLIENT_ORIGIN;
if (!process.env.DATABASE_URL || !origin) throw new Error('DATABASE_URL and CLIENT_ORIGIN are required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 10000, query_timeout: 15000 });
const app = await buildApp({ pool, origin, cookieSecure: process.env.COOKIE_SECURE === 'true' });
app.addHook('onClose', async () => pool.end());
await migrate(pool);
const cleanUpSessions = () => deleteExpiredSessions(pool).catch(error => app.log.error(error));
await cleanUpSessions();
setInterval(cleanUpSessions, 60 * 60 * 1000).unref();
await app.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' });
