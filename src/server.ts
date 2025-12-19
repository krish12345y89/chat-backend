import http from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import app from "./app";
import { socketAuth } from "./middlewares/socketAuth.middleware";
import { chatSocket } from "./modules/chat/chat.socket";
import { env } from "./config/env";

export let ioInstance: Server | null = null;

export const createServer = async () => {
  const server = http.createServer(app);

  const io = new Server(server, { cors: { origin: "*" } });
  ioInstance = io;

  // Setup Redis adapter for horizontal scaling
  if (env.REDIS_URL) {
    const pubClient = createClient({ url: env.REDIS_URL });
    const subClient = pubClient.duplicate();
    await pubClient.connect();
    await subClient.connect();
    io.adapter(createAdapter(pubClient, subClient));
  }

  io.use((socket, next) => socketAuth(socket, next));
  chatSocket(io);

  return server;
};

