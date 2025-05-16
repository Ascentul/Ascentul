import { Request, Response, NextFunction } from 'express';
import { User } from "../../utils/schema";
import { storage } from '../storage';

// Extend Express Request to include auth methods
declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user?: User;
    }
  }
}

/**
 * Middleware to allow public access (no auth required)
 * For testing purposes only - should not be used in production
 */
export const publicAccess = async (req: Request, res: Response, next: NextFunction) => {
  // Just pass through without any auth checks
  next();
};

/**
 * Middleware to validate that a user is authenticated
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

/**
 * Middleware to validate that a user is an admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const user = req.user;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  
  next();
};

/**
 * Middleware to validate that a user is a super admin
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const user = req.user;
  if (user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin privileges required' });
  }
  
  next();
};

/**
 * Middleware to validate that a user is a university admin
 */
export const requireUniversityAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const user = req.user;
  if (user.role !== 'university_admin') {
    return res.status(403).json({ message: 'University admin privileges required' });
  }
  
  next();
};

/**
 * Middleware to validate that a user belongs to the requested university
 * or is an admin/super admin
 */
export const validateUniversityAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const user = req.user;
  const universityId = parseInt(req.params.universityId);
  
  // Admins and super admins have access to all universities
  if (user.role === 'admin' || user.role === 'super_admin') {
    return next();
  }
  
  // University admins have access to their own university
  if (user.role === 'university_admin' && user.universityId === universityId) {
    return next();
  }
  
  // University students have access to their own university's data
  if (user.userType === 'university_student' && user.universityId === universityId) {
    return next();
  }
  
  return res.status(403).json({ message: 'You do not have access to this university' });
};

/**
 * Middleware to validate that a user owns the requested resource or is an admin
 */
export const validateResourceOwnership = (userIdKey: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = req.user;
    
    // Admins and super admins have access to all resources
    if (user.role === 'admin' || user.role === 'super_admin') {
      return next();
    }
    
    // Check if the user owns the resource
    const resourceUserId = req.body[userIdKey] || req.params[userIdKey];
    if (resourceUserId && parseInt(resourceUserId) === user.id) {
      return next();
    }
    
    return res.status(403).json({ message: 'You do not have permission to access this resource' });
  };
};