import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Socket } from "socket.io";
import { redisClient } from "../config/redis.config";
import cookie from "cookie";

export const socketAuth = async (socket: Socket, next: (err?: any) => void) => {
  try {
    const token = (socket.handshake.auth as any)?.token;
    if (token) {
      const payload: any = jwt.verify(token, String(env.JWT_SECRET));
      (socket.data as any).userId = payload.userId;
      return next();
    }

    // try session cookie (connect.sid)
    const cookieHeader = socket.handshake.headers?.cookie;
    if (!cookieHeader) return next(new Error("Unauthorized socket"));
    const cookies = cookie.parse(cookieHeader || "");
    let sid = cookies["connect.sid"] || cookies["sid"] || cookies["session"];
    if (!sid) return next(new Error("Unauthorized socket"));
    // remove optional "s:" prefix and signature if present
    if (sid.startsWith("s:")) {
      sid = sid.slice(2).split(".")[0];
    }
    try { sid = decodeURIComponent(sid); } catch {}
    const stored = await redisClient.get(`sess:${sid}`);
    if (!stored) return next(new Error("Unauthorized socket"));
    const session = JSON.parse(stored);
    if (!session || !session.userId) return next(new Error("Unauthorized socket"));
    (socket.data as any).userId = session.userId;
    return next();
  } catch (err) {
    next(new Error("Unauthorized socket"));
  }
};
