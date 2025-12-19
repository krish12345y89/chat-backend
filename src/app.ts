import express from "express";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import connectRedis from "connect-redis";
import { setupSwagger } from "./config/swagger.config";
import authRouter from "./routes/auth.route";
import chatRouter from "./routes/chat.route";
import { restAuth } from "./middlewares/auth.middleware";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { logger } from "./utils/logger";
import { redisClient } from "./config/redis.config";
import { env } from "./config/env";

export const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// session store: use in-memory store during tests to avoid requiring a running Redis
let sessionStore: any;
if (process.env.NODE_ENV === 'test') {
	sessionStore = new session.MemoryStore();
} else {
	// connect-redis v7+ exports a class; construct with redis client
	sessionStore = new (connectRedis as any)({ client: redisClient as any });
}

app.use(
	session({
		store: sessionStore,
		secret: env.JWT_SECRET || "dev-session-secret",
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 1000 * 60 * 60 * 24, // 1 day
		},
	})
);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRouter);
app.use("/chats", restAuth, chatRouter);

// basic request logger
app.use((req, res, next) => {
	logger.info(req.method, req.url);
	next();
});

// error handler (should be last)
app.use(errorHandler);

setupSwagger(app);

export default app;
