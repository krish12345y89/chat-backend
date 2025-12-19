import { Schema, model } from "mongoose";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String },
  },
  { timestamps: true }
);

export const User = model("User", UserSchema);
