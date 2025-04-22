import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';
import { storage } from './storage';

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

/**
 * Get the current user from the session
 * Centralizes the logic for retrieving the current user
 */
export async function getCurrentUser(req: Request): Promise<User | null> {
  try {
    // Debug session information
    console.log("Session data in getCurrentUser:", {
      id: req.sessionID,
      userId: req.session?.userId,
      authenticated: req.session?.authenticated,
      cookies: req.headers.cookie
    });
    
    // Check if the browser has a special logout flag set (from localStorage)
    if (req.headers['x-auth-logout'] === 'true') {
      console.log("Logout flag set in headers, returning null");
      return null;
    }
    
    // Check if user is logged in via session
    if (req.session && req.session.userId) {
      console.log(`Getting user with ID ${req.session.userId} from storage`);
      const user = await storage.getUser(req.session.userId);
      
      if (user) {
        console.log(`User found: ${user.id}, ${user.name}, ${user.email}`);
        // Set a flag in the session to indicate it was used successfully
        req.session.authenticated = true;
        req.session.lastAccess = new Date().toISOString();
        
        // Save session synchronously to ensure it's updated before response
        await new Promise<void>((resolve, reject) => {
          req.session.save(err => {
            if (err) {
              console.error('Error saving session:', err);
              reject(err);
            } else {
              console.log("Session saved successfully");
              resolve();
            }
          });
        });
        
        return user;
      } else {
        console.log(`No user found for ID ${req.session.userId}`);
      }
    } else {
      console.log("No userId in session or session doesn't exist");
    }
    
    // Return null if no valid user found
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Middleware to check if user is authenticated
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Debug session information
  console.log("Session data in requireAuth:", {
    id: req.sessionID,
    userId: req.session?.userId,
    authenticated: req.session?.authenticated,
    cookies: req.headers.cookie
  });
  
  // Check if the browser has a special logout flag set (from localStorage)
  const isLoggedOut = req.headers['x-auth-logout'] === 'true';
  if (isLoggedOut) {
    console.log("Logout flag set in headers, denying authentication");
    return sendUnauthenticatedResponse(res, "Session flagged as logged out");
  }
  
  if (!req.session || !req.session.userId) {
    console.log("No valid session or userId for authentication");
    return sendUnauthenticatedResponse(res);
  }
  
  // Set a flag in the session to indicate it was used successfully
  if (req.session) {
    req.session.authenticated = true;
    req.session.lastAccess = new Date().toISOString();
    
    // Save the session synchronously to ensure it's properly stored
    // Using Promise to make the save operation wait before continuing
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.save(err => {
          if (err) {
            console.error('Error saving session in requireAuth:', err);
            reject(err);
          } else {
            console.log("Session saved successfully in requireAuth");
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Failed to save session in requireAuth:', error);
      return sendUnauthenticatedResponse(res, "Session error");
    }
  }
  
  // Mark response as authenticated
  markResponseAuthenticated(res);
  console.log("User authenticated, proceeding");
  next();
}

// Middleware to check if user is an admin
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // First verify that the user is authenticated
  if (!req.session || !req.session.userId) {
    return sendUnauthenticatedResponse(res);
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return sendUnauthenticatedResponse(res);
    }
    
    // Ensure the user is of admin type
    if (user.userType !== 'admin') {
      return res.status(403).json({
        message: "Admin access required for this operation"
      });
    }
    
    // Mark response as authenticated
    markResponseAuthenticated(res);
    next();
  } catch (error) {
    console.error("Error checking admin rights:", error);
    return res.status(500).json({ 
      message: "Internal server error verifying admin permissions" 
    });
  }
}

// Middleware to check if user is staff or admin
export async function requireStaff(req: Request, res: Response, next: NextFunction) {
  // First verify that the user is authenticated
  if (!req.session || !req.session.userId) {
    return sendUnauthenticatedResponse(res);
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return sendUnauthenticatedResponse(res);
    }
    
    // Ensure the user is of admin or staff type
    if (user.userType !== 'admin' && user.userType !== 'staff') {
      return res.status(403).json({
        message: "Staff access required for this operation"
      });
    }
    
    // Mark response as authenticated
    markResponseAuthenticated(res);
    next();
  } catch (error) {
    console.error("Error checking staff rights:", error);
    return res.status(500).json({ 
      message: "Internal server error verifying staff permissions" 
    });
  }
}

// Middleware to validate that a user has access to a specific resource
export async function validateUserAccess(req: Request, res: Response, next: NextFunction) {
  // First verify that the user is authenticated
  if (!req.session || !req.session.userId) {
    return sendUnauthenticatedResponse(res);
  }
  
  try {
    const userId = req.session.userId;
    const resourceId = parseInt(req.params.id);
    
    if (isNaN(resourceId)) {
      return res.status(400).json({
        message: "Invalid resource ID"
      });
    }
    
    // Check if the user is an admin or staff, they have access to all resources
    const user = await storage.getUser(userId);
    if (user && (user.userType === 'admin' || user.userType === 'staff')) {
      // Mark response as authenticated
      markResponseAuthenticated(res);
      return next();
    }
    
    // Regular users need to be verified for resource ownership
    // The exact check depends on the resource type - for simplicity, check if a resource
    // belongs to the authenticated user based on the path
    
    // Extract resource type from the path
    const path = req.path;
    let validAccess = false;
    
    if (path.includes('/applications/')) {
      // Check job application ownership
      const application = await storage.getJobApplication(resourceId);
      validAccess = application && application.userId === userId;
    } else if (path.includes('/application-steps/')) {
      // Check application step ownership by checking the parent application
      const step = await storage.getApplicationWizardStep(resourceId);
      if (step) {
        const application = await storage.getJobApplication(step.applicationId);
        validAccess = application && application.userId === userId;
      }
    } else if (path.includes('/goals/')) {
      // Check goal ownership
      const goal = await storage.getGoal(resourceId);
      validAccess = goal && goal.userId === userId;
    } else if (path.includes('/skill-stacker/')) {
      // Check skill stacker ownership
      const plan = await storage.getSkillStackerPlan(resourceId);
      validAccess = plan && plan.userId === userId;
    } else if (path.includes('/interview/processes/')) {
      // Check interview process ownership
      const process = await storage.getInterviewProcess(resourceId);
      validAccess = process && process.userId === userId;
    } else if (path.includes('/interview/stages/')) {
      // Check stage ownership by checking the parent process
      const stage = await storage.getInterviewStage(resourceId);
      if (stage) {
        const process = await storage.getInterviewProcess(stage.processId);
        validAccess = process && process.userId === userId;
      }
    } else if (path.includes('/interview/followup-actions/')) {
      // Check followup action ownership by checking the parent process
      const action = await storage.getFollowupAction(resourceId);
      if (action) {
        const process = await storage.getInterviewProcess(action.processId);
        validAccess = process && process.userId === userId;
      }
    }
    
    // If validation failed, return 403 Forbidden
    if (!validAccess) {
      return res.status(403).json({
        message: "You do not have permission to access this resource"
      });
    }
    
    // Mark response as authenticated
    markResponseAuthenticated(res);
    next();
  } catch (error) {
    console.error("Error validating user access:", error);
    return res.status(500).json({ 
      message: "Internal server error validating access permissions" 
    });
  }
}