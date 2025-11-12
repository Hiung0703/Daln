Simple server for check-ocr-web

Endpoints:
- POST /api/auth/register  { username, password } => { user, token }
- POST /api/auth/login     { username, password } => { user, token }
- GET  /api/history        (auth) => [ histories ]
- POST /api/history        (auth) { content, meta } => created history

Run:
1. cd server
2. pnpm install
3. pnpm start

The server uses SQLite stored in `server/data/app.db`.

Set JWT secret with env var JWT_SECRET for production.
