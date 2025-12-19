export const env = {
  PORT: Number(process.env.PORT || 3000),
  MONGO_URI: process.env.MONGO_URI || "",
  REDIS_URL: process.env.REDIS_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || undefined,
};

export const requireEnv = () => {
  if (!env.MONGO_URI) throw new Error("MONGO_URI is required");
  if (!env.REDIS_URL) throw new Error("REDIS_URL is required");
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET is required");
};
