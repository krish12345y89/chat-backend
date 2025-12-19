# Chat Backend — Explanation

This repository implements an enterprise-ready real-time one-to-one chat backend using TypeScript, Express, Socket.IO, MongoDB (Mongoose) and Redis. It provides both Socket.IO realtime endpoints for primary chat flows and complementary REST endpoints for integrations and convenience.

Key ideas and responsibilities

- Realtime first: Socket.IO is the primary protocol for sending/receiving messages. Server authenticates sockets via JWT (`auth.token`) or by a session cookie (when present).
- Persistent storage: All messages are persisted to MongoDB using Mongoose models (`ChatMessage`). REST chat endpoints (`/chats/...`) expose history and conversation lists.
- Presence & scaling: Redis is used for presence (maps `user:{userId} -> socketId`) and to scale Socket.IO with the Redis adapter (`@socket.io/redis-adapter`).
- Authentication: A modular user domain exists (models, repository, service, controller) exposing `register`, `login`, and `me` routes. JWTs are returned for token-based auth; `express-session` + `connect-redis` provides cookie/session-based auth alternative and is used by Socket.IO when cookies are present.
- Sessions in tests: During tests, `MemoryStore` is used to avoid requiring a running Redis instance.
- Middleware & cross-cutting concerns: Middlewares include `restAuth` (accepts Bearer JWT or session cookie), socket auth accepting either token or session cookie, request validation helpers, and a centralized error handler.
- Documentation & API: An OpenAPI `swagger.yaml` documents REST endpoints and includes a `x-socket-events` section describing Socket.IO events and payloads.
- Testing: Jest + ts-jest + Supertest tests cover auth and chat flows; tests use `supertest.agent` to validate session cookie flows.

Where to look in the code

- App boot: `src/index.ts`, `src/server.ts`, `src/app.ts`.
- Config: `src/config/{env,mongo.config,redis.config,swagger.config}`.
- User module: `src/modules/user/*` (model, repository, service, controller).
- Chat module: `src/modules/chat/*` (model, service, socket handlers).
- Routes: `src/routes/{auth.route.ts,chat.route.ts}`.
- Middlewares: `src/middlewares/*` (auth, socketAuth, validate, errorHandler).
- Utils: `src/utils/{jwt.util,logger}`.
- Tests: `tests/*.test.ts`.

Security notes

- JWT secret must be set in `JWT_SECRET` env in production.
- In production, configure secure cookies and HTTPS; `cookie.secure` flag is enabled when `NODE_ENV === 'production'`.
- Do not use the simple test `/auth/login` endpoint (if still present) for production; it is intended for local dev only.

Operational notes

- For local development the repository contains `docker-compose.yml` with services for MongoDB and Redis. When running in CI or production, provide hosted DB and Redis and set `MONGO_URI`, `REDIS_URL`, and `JWT_SECRET` environment variables.
- Socket scaling: provide a shared Redis instance for the Socket.IO adapter and session store.

Limitations & next steps

- Add rate-limiting and per-user quotas to prevent abuse.
- Add end-to-end tests using `mongodb-memory-server` to exercise DB writes without external services.
- Consider rotating session storage keys and adding session TTL management for large deployments.
