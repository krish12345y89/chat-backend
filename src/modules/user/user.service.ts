import bcrypt from "bcryptjs";
import { userRepository } from "./user.repository";

export const createUser = async (username: string, password: string, displayName?: string) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return userRepository.create({ username, passwordHash, displayName });
};

export const findByUsername = async (username: string) => {
  return userRepository.findByUsername(username);
};

export const findById = async (id: string) => {
  return userRepository.findById(id);
};

export const validatePassword = async (user: any, password: string) => {
  return bcrypt.compare(password, (user as any).passwordHash);
};
