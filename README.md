# Real-Time Chat Backend (Enterprise)

Tech stack: TypeScript, Express, Socket.IO, MongoDB, Redis, JWT

Features
- JWT authenticated socket connections
- Real-time one-to-one messaging
- Online presence stored in Redis
- Message persistence in MongoDB
- Swagger UI for health/docs

Quick start (local)

```bash
copy .env.example .env
npm install
npm run dev
```

Docker (recommended for evaluation)

```bash
docker compose up --build
```

Auth (test)

POST /auth/login
Body: { "userId": "alice" }
Returns: { token }

Session cookie auth

The server also issues an HttpOnly session cookie when using `express-session` + `connect-redis`. Tests use `supertest.agent` to validate cookie-based auth flows. To use cookie auth from browsers, authenticate via `POST /auth/login` and subsequent requests will include the `connect.sid` cookie.

Socket usage (client)

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:3000", { auth: { token: JWT } });

socket.emit('send_message', { receiverId: 'bob', message: 'hello' });
socket.on('receive_message', (msg) => console.log(msg));

// fetch history
socket.emit('fetch_history', { withUser: 'bob' });
socket.on('chat_history', (history) => console.log(history));
```

Scaling notes
- This app uses the `@socket.io/redis-adapter` so multiple Node instances can be run behind a load balancer.
- For Socket.IO, either use sticky sessions at load balancer layer, or rely on the Redis adapter for pub/sub to deliver events across instances.
- In production, run Redis in clustered or managed mode, enable persistence and backups.

Docs
- Swagger UI: http://localhost:3000/docs

Files
- EXPLANATION.md — high-level explanation of repository and decisions
- ARCHITECTURE.md — architecture overview, message flow and scaling notes

If you want I can also add a small diagram or export a PlantUML file for the architecture.
