import { Request, Response } from 'express';

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}