import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const secret = process.env.SESSION_SECRET || "change-me-to-a-long-random-string";

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    req.log.error({ err }, "Invalid JWT");
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
