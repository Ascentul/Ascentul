import { Request, Response, NextFunction } from 'express';

/**
 * Utility function to send a consistent unauthenticated response
 */
export function sendUnauthenticatedResponse(res: Response, message = "Authentication required") {
  return res
    .status(401)
    .set('X-Auth-Status', 'unauthenticated')
    .json({ message });
}

/**
 * Utility function to mark a response as authenticated
 */
export function markResponseAuthenticated(res: Response) {
  res.set('X-Auth-Status', 'authenticated');
  return res;
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if the browser has a special logout flag set (from localStorage)
  const isLoggedOut = req.headers['x-auth-logout'] === 'true';
  if (isLoggedOut) {
    return sendUnauthenticatedResponse(res, "Session flagged as logged out");
  }
  
  if (!req.session || !req.session.userId) {
    return sendUnauthenticatedResponse(res);
  }
  
  // Set a flag in the session to indicate it was used successfully
  if (req.session) {
    req.session.authenticated = true;
    req.session.lastAccess = new Date().toISOString();
    // Don't wait for save to complete before continuing
    req.session.save(err => {
      if (err) {
        console.error('Error saving session:', err);
      }
    });
  }
  
  // Mark response as authenticated
  markResponseAuthenticated(res);
  next();
}