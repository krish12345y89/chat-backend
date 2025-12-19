import mongoose from "mongoose";
import { env } from "./env";

export const connectMongo = async () => {
  await mongoose.connect(env.MONGO_URI, {
    // keep options minimal; mongoose 7+ handles defaults
  } as any);
  console.log("MongoDB connected");
};
