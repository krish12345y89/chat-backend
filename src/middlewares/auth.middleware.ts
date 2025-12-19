import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.util";

export const restAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // allow session-based auth via cookie
    try {
      const sidUser = (req as any).session && (req as any).session.userId;
      if (sidUser) {
        (req as any).userId = sidUser;
        return next();
      }
    } catch {}
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
    const token = auth.split(" ")[1];
    const payload = verifyToken<{ userId: string }>(token);
    (req as any).userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
