import "dotenv/config";
import { env, requireEnv } from "./config/env";
import { connectMongo } from "./config/mongo.config";
import { connectRedis } from "./config/redis.config";
import { createServer } from "./server";
import mongoose from "mongoose";
import { redisClient } from "./config/redis.config";

(async () => {
  try {
    requireEnv();
    await connectMongo();
    await connectRedis();

    const server = await createServer();
    const listener = server.listen(env.PORT, () => console.log(`Server running on ${env.PORT}`));

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down...`);
      listener.close(() => console.log("HTTP server closed"));
      try {
        await mongoose.disconnect();
        console.log("Mongo disconnected");
      } catch (e) {
        console.error("Error disconnecting mongo", e);
      }
      try {
        await redisClient.disconnect();
        console.log("Redis disconnected");
      } catch (e) {
        console.error("Error disconnecting redis", e);
      }
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("Startup error", err);
    process.exit(1);
  }
})();
