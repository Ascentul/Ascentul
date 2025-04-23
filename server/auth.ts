import { Request, Response } from 'express';

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: () => void) {
  console.log("Checking auth. Session:", req.session?.userId ? "Has userId" : "No userId");
  
  if (!req.session || !req.session.userId) {
    console.log("Auth check failed - no session or userId");
    return res.status(401).json({ message: "Authentication required" });
  }
  
  console.log("Auth check passed for user ID:", req.session.userId);
  next();
}

// Modified authentication middleware that automatically logs in as a demo user
// This is a temporary solution for development purposes
export function requireLoginFallback(req: Request, res: Response, next: () => void) {
  console.log("Checking auth with fallback enabled. Session:", req.session?.userId ? "Has userId" : "No userId");
  
  if (!req.session || !req.session.userId) {
    console.log("Auto-assigning demo user ID");
    // Set session with the demo user ID
    req.session.userId = 2; // Demo user ID
  }
  
  console.log("Auth check passed for user ID:", req.session.userId);
  next();
}