# Architecture Overview

This document describes the high-level architecture of the chat backend and how components interact.

1) Components

- Client: Browser or mobile client using Socket.IO client library or REST.
- Load Balancer / API Gateway: Optional; routes HTTP and WebSocket traffic to application instances.
- App (Node + Express + Socket.IO): Core application that handles HTTP endpoints and real-time sockets.
  - `src/app.ts` — Express app and middleware.
  - `src/server.ts` — HTTP server + Socket.IO and Redis adapter wiring.
  - `src/index.ts` — startup orchestration (connect DB, redis, start server).
- MongoDB: Persistence for user records and chat messages. Access through Mongoose models (`src/modules/*/*.model.ts`).
- Redis:
  - Session store (connect-redis) for `express-session`.
  - Socket.IO adapter for scaling across instances using `@socket.io/redis-adapter`.
  - Lightweight presence store mapping `user:{userId}` to `socketId` for direct delivery.

2) Authentication & Authorization

- Two supported methods:
  - JWT Bearer tokens: Clients receive JWTs on login/registration and send them as `Authorization: Bearer <token>` for REST or as `auth.token` for Socket.IO.
  - Session cookies: Server sets an HttpOnly cookie (`connect.sid`) when `express-session` is used. Middlewares accept session cookie as alternative authentication mechanism for REST and sockets.

3) Message flow (realtime send)

1. Client A connects to Socket.IO with JWT or cookie.
2. Server authenticates socket and stores `user:{userId} -> socketId` in Redis.
3. Client A emits `send_message` with payload `{ receiverId, message }`.
4. Server persists message in MongoDB and attempts to deliver to receiver:
   - Look up `user:{receiverId}` in Redis to find socket id.
   - If found, use `io.to(socketId).emit('receive_message', message)`.
   - Always send an ack `message_sent` to sender.

4) REST routes (complementary)

- `POST /auth/register` — create user, return JWT and set session cookie (for cookie auth).
- `POST /auth/login` — validate credentials, return JWT and set session cookie.
- `GET /auth/me` — return current user from JWT or session.
- `GET /chats/:userId/with/:withUser` — return history between two users.
- `POST /chats/:userId/send` — persist a message and deliver if recipient online.

5) Scalability considerations

- Use Redis adapter to scale Socket.IO horizontally; ensure `pubClient` and `subClient` connect to a shared Redis instance.
- Use sticky sessions at LB layer only if not using the Redis adapter.
- For large deployments, shard presence keys or use sorted sets with TTLs for ephemeral presence.

6) Observability & maintenance

- Add structured logging and log correlation ids for requests and sockets.
- Add health checks for Mongo and Redis and expose in `/health`.
- Monitor Redis and Mongo readiness and latency.
