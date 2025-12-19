import { User } from "./user.model";

export const userRepository = {
  create: (doc: any) => User.create(doc),
  findByUsername: (username: string) => User.findOne({ username }),
  findById: (id: string) => User.findById(id).select("username displayName"),
};
