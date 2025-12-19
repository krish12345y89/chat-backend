import jwt, { SignOptions, Secret } from "jsonwebtoken";
import { env } from "../config/env";

export const signToken = (payload: object, expiresIn = 3600*3600*15) => {
  const secret: Secret = (env.JWT_SECRET as Secret) || ("test-secret" as Secret);
  const opts: SignOptions = { expiresIn };
  return jwt.sign(payload as any, secret, opts);
};

export const verifyToken = <T = any>(token: string) => {
  const secret: Secret = (env.JWT_SECRET as Secret) || ("test-secret" as Secret);
  return jwt.verify(token, secret) as T;
};
