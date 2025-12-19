import { Request, Response, NextFunction } from "express";

export const requireFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const f of fields) {
      if (!req.body || typeof (req.body as any)[f] === 'undefined') {
        return res.status(400).json({ message: `${f} is required` });
      }
    }
    next();
  };
};
