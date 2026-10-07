# Notely

Angular client with a Fastify/PostgreSQL API. Visitors can create notes and tags without an account. On save they can register, log in, or continue with local browser storage. The app warns when data is saved only on the device. Signing in imports local notes and tags into the account before removing the local copy.

## Development

Run `docker compose up --build` and open http://localhost:4201. The API is at http://localhost:3001 and PostgreSQL is exposed locally on port 5432. The database schema is created by the server on startup.

For running without Docker, create a PostgreSQL database, copy `server/config/.env.development.example` to `server/.env`, set its connection string, then run `npm ci --prefix server`, `npm run dev --prefix server`, `npm ci --prefix client --legacy-peer-deps`, and `npm start --prefix client`.

## Production

The Vercel project serves `client/` and proxies `/api/*` to the Railway API through `client/vercel.json`. The Railway project runs the Fastify API from `server/` with PostgreSQL. Set `DATABASE_URL` to the Railway Postgres service URL, `CLIENT_ORIGIN` to the exact Vercel site origin, and `COOKIE_SECURE=true`. The API uses secure, HTTP-only session cookies.

Rate limits identify visitors by the `X-Real-IP` header that Railway's edge sets, so requests proxied through Vercel share the limits of the Vercel address they arrive from. The API limits requests per address (120 per minute overall, 5 sign-ups per hour, 10 data imports per minute), login attempts per address (30 per 15 minutes) and per account (10 per 15 minutes) and sign-ups across all visitors (50 per hour). Each account holds at most 500 notes, 100 tags and 5 MB of note text, and a note's content is limited to 20,000 characters. A user keeps at most 10 sessions, and expired sessions are deleted hourly. Back up the PostgreSQL database separately.

For a Docker deployment, copy `.env.production.example` to `.env`, set the PostgreSQL URL and HTTPS origins, then run `docker compose -f compose.prod.yaml up --build -d`. The client image serves on localhost:8080 and the API on localhost:3001; expose both through an HTTPS reverse proxy. Set `API_URL` to that proxy's public API path or origin.
