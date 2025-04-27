import { Request, Response } from 'express';
import { storage } from './storage';

// Add type for augmenting Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        name: string;
        email: string;
        userType: string; // "regular", "admin", "staff"
        // Add other user fields as needed
      } | null;
    }
  }
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: () => void) {
  console.log("Checking auth. Session:", req.session?.userId ? "Has userId" : "No userId");
  
  if (!req.session || !req.session.userId) {
    console.log("Auth check failed - no session or userId");
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // If we already have the user in the request, don't fetch it again
  if (req.user) {
    console.log("Auth check passed for user ID:", req.session.userId);
    return next();
  }
  
  // Fetch the user data to attach to the request
  storage.getUser(req.session.userId)
    .then(user => {
      if (!user) {
        console.log("Auth check failed - user not found");
        // Clear the invalid session
        req.session.destroy((err) => {
          if (err) console.error("Error destroying session:", err);
        });
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Attach the user to the request
      req.user = user;
      console.log("Auth check passed for user ID:", req.session.userId);
      next();
    })
    .catch(err => {
      console.error("Error fetching user:", err);
      return res.status(500).json({ message: "Internal server error" });
    });
}

// Check if user is an admin
export function isAdmin(req: Request): boolean {
  return req.user?.userType === 'admin';
}

// Middleware to check if user is an admin
export function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.user) {
    return requireAuth(req, res, () => {
      checkAdminAndProceed();
    });
  } else {
    checkAdminAndProceed();
  }
  
  function checkAdminAndProceed() {
    if (!isAdmin(req)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Admin privileges required to access this resource' 
      });
    }
    next();
  }
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
  
  // If we already have the user in the request, don't fetch it again
  if (req.user) {
    console.log("Auth check passed for user ID:", req.session.userId);
    return next();
  }
  
  // Fetch the user data to attach to the request
  storage.getUser(req.session.userId)
    .then(user => {
      if (user) {
        // Attach the user to the request
        req.user = user;
      }
      console.log("Auth check passed for user ID:", req.session.userId);
      next();
    })
    .catch(err => {
      console.error("Error fetching user:", err);
      // Continue anyway in fallback mode
      next();
    });
}