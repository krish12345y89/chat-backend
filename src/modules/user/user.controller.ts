import { Request, Response, NextFunction } from "express";
import * as userService from "./user.service";
import { signToken } from "../../utils/jwt.util";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password, displayName } = req.body;
    const existing = await userService.findByUsername(username);
    if (existing)
      return res.status(409).json({ message: "username already exists" });
    const user = await userService.createUser(username, password, displayName);
    const token = signToken({ userId: user._id.toString() });
    // set session cookie
    try {
      (req.session as any).userId = user._id.toString();
    } catch {}
    res
      .status(201)
      .json({
        token,
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
        },
      });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;
    const user = await userService.findByUsername(username);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await userService.validatePassword(user, password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = signToken({ userId: user._id.toString() });
    try {
      (req.session as any).userId = user._id.toString();
    } catch {}
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).userId as string;
    const user = await userService.findById(userId);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json({
      id: user._id,
      username: user.username,
      displayName: user.displayName,
    });
  } catch (err) {
    next(err);
  }
};
