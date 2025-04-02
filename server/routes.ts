import express, { Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import Stripe from "stripe";
import crypto from "crypto";
import { 
  insertUserSchema, 
  insertGoalSchema, 
  insertWorkHistorySchema, 
  insertResumeSchema, 
  insertCoverLetterSchema, 
  insertInterviewPracticeSchema,
  insertInterviewProcessSchema,
  insertInterviewStageSchema,
  insertFollowupActionSchema,
  insertContactMessageSchema,
  insertMentorChatConversationSchema,
  insertMentorChatMessageSchema,
  insertRecommendationSchema,
  type User
} from "@shared/schema";
import { getCareerAdvice, generateResumeSuggestions, generateCoverLetter, generateInterviewQuestions, suggestCareerGoals } from "./openai";
import { createPaymentIntent, createPaymentIntentSchema, createSubscription, createSubscriptionSchema, handleSubscriptionUpdated, cancelSubscription, generateEmailVerificationToken, verifyEmail, createSetupIntent, getUserPaymentMethods, stripe } from "./services/stripe";

// Helper function to get the current user from the session
async function getCurrentUser(req: Request): Promise<User | null> {
  try {
    // Check if user is logged in via session
    if (req.session && req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        return user;
      }
    }
    
    // Return null if no valid user found
    return null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware to check if user is an admin
async function requireAdmin(req: Request, res: Response, next: () => void) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || user.userType !== 'admin') {
    console.log(`Access denied: User ${req.session.userId} tried to access admin route`);
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
  
  next();
}

// Middleware to check if user is a staff member
async function requireStaff(req: Request, res: Response, next: () => void) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'staff' && user.userType !== 'admin')) {
    console.log(`Access denied: User ${req.session.userId} tried to access staff route`);
    return res.status(403).json({ message: "Access denied. Staff privileges required." });
  }
  
  next();
}

// Middleware to check if user is a university admin
async function requireUniversityAdmin(req: Request, res: Response, next: () => void) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || user.userType !== 'university_admin') {
    console.log(`Access denied: User ${req.session.userId} tried to access university admin route`);
    return res.status(403).json({ message: "Access denied. University admin privileges required." });
  }
  
  next();
}

// Middleware to check if user belongs to a university
async function requireUniversityUser(req: Request, res: Response, next: () => void) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user || (user.userType !== 'university_student' && user.userType !== 'university_admin')) {
    console.log(`Access denied: User ${req.session.userId} tried to access university route`);
    return res.status(403).json({ message: "Access denied. University access required." });
  }
  
  next();
}

// Middleware for data validation to ensure users can only access their own data
async function validateUserAccess(req: Request, res: Response, next: () => void) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Get the requested resource ID (usually from URL params)
  const resourceId = req.params.id ? parseInt(req.params.id) : null;
  const resourceUserId = req.params.userId ? parseInt(req.params.userId) : null;
  
  if (!resourceId && !resourceUserId) {
    // If no specific resource is targeted, allow the request to proceed
    return next();
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  // Admins can access any data
  if (user.userType === 'admin') {
    return next();
  }
  
  // Check if the targeted resource belongs to the user
  // This will need to be customized based on the specific resource type
  // For example, for work history: const resource = await storage.getWorkHistory(resourceId);
  // Then check if resource.userId === user.id
  
  // For university admins, check if the resource belongs to a student from their university
  if (user.userType === 'university_admin' && resourceUserId) {
    const targetUser = await storage.getUser(resourceUserId);
    if (targetUser && targetUser.universityId === user.universityId) {
      return next();
    }
  }
  
  // For all other cases, only allow access to own data
  if (resourceUserId && resourceUserId !== user.id) {
    console.log(`Data access violation: User ${user.id} attempted to access data for user ${resourceUserId}`);
    return res.status(403).json({ message: "Access denied. You can only access your own data." });
  }
  
  // Default case - proceed to the route handler
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Create admin and sample users at startup
  try {
    // Create founder/admin account
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      // Hash admin password
      const adminPwd = "admin123"; // In production, use a stronger password
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(adminPwd, salt, 1000, 64, 'sha512').toString('hex');
      const securePassword = `${hashedPassword}.${salt}`;
      
      const adminUser = await storage.createUser({
        username: "admin",
        password: securePassword,
        name: "Admin User",
        email: "admin@careertracker.io",
        userType: "admin", // Special admin type
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80",
        subscriptionStatus: "active",
        needsUsername: false, // Admin account already has a username
      });
      
      // Update admin with additional fields
      await storage.updateUser(adminUser.id, {
        subscriptionPlan: "premium",
        emailVerified: true
      });
      console.log("Created admin user:", adminUser.id);
    }
    
    // Create a regular sample user for testing
    const existingUser = await storage.getUserByUsername("alex");
    if (!existingUser) {
      // Hash sample user password
      const userPwd = "password";
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(userPwd, salt, 1000, 64, 'sha512').toString('hex');
      const securePassword = `${hashedPassword}.${salt}`;
      
      const sampleUser = await storage.createUser({
        username: "alex",
        password: securePassword,
        name: "Alex Johnson",
        email: "alex@example.com",
        userType: "university_student",
        universityId: 1,
        departmentId: 2,
        studentId: "U12345",
        graduationYear: 2025,
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80",
        subscriptionStatus: "active",
        needsUsername: false,
      });
      
      // Then update with additional fields
      await storage.updateUser(sampleUser.id, {
        subscriptionPlan: "university",
        emailVerified: true,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month from now
      });
      console.log("Created sample user:", sampleUser.id);
      
      // Add sample goals
      await storage.createGoal(sampleUser.id, {
        title: "Update LinkedIn Profile",
        description: "Add recent projects and update skills",
        status: "in-progress",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        xpReward: 100
      });
      
      await storage.createGoal(sampleUser.id, {
        title: "Complete Python Course",
        description: "Finish advanced modules and final project",
        status: "active",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        xpReward: 200
      });
      
      await storage.createGoal(sampleUser.id, {
        title: "Prepare for Technical Interview",
        description: "Practice algorithm questions and system design",
        status: "on-track",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
        xpReward: 250
      });
      
      // Add some XP to the user if they are a university user
      if (sampleUser.userType === "university_student" || sampleUser.userType === "university_admin") {
        await storage.addUserXP(sampleUser.id, 2450, "initial_setup", "Initial user setup");
      }
      
      // Create a sample conversation
      const conversation = await storage.createAiCoachConversation(sampleUser.id, {
        title: "Interview Preparation"
      });
      
      // Add sample messages
      await storage.addAiCoachMessage({
        conversationId: conversation.id,
        isUser: false,
        message: "Hello Alex! I'm your AI career coach. How can I help you today with your career goals?"
      });
      
      await storage.addAiCoachMessage({
        conversationId: conversation.id,
        isUser: true,
        message: "I'm preparing for a job interview next week. Can you help me with some common questions for a software developer role?"
      });
      
      await storage.addAiCoachMessage({
        conversationId: conversation.id,
        isUser: false,
        message: `Absolutely! For a software developer role, you should prepare for these common questions:

- Tell me about a challenging project you worked on
- How do you approach debugging a complex issue?
- Describe your experience with [specific technology]
- How do you stay updated with industry trends?
- Give an example of how you handled a disagreement with a team member

Would you like me to provide detailed tips for answering any of these questions?`
      });
      
      await storage.addAiCoachMessage({
        conversationId: conversation.id,
        isUser: true,
        message: "Yes, please give me tips for the debugging question. Also, what kind of projects should I highlight in my portfolio?"
      });
      
      await storage.addAiCoachMessage({
        conversationId: conversation.id,
        isUser: false,
        message: `For the debugging question:

When answering how you approach debugging, use the STAR method (Situation, Task, Action, Result):

1. Start by describing your systematic approach (e.g., reproducing the issue, isolating variables)
2. Mention specific tools you use (debuggers, logging)
3. Emphasize collaboration when appropriate
4. Share a specific example where you solved a challenging bug
5. Highlight what you learned from the experience

For portfolio projects:

Based on your profile and the job you're targeting, I recommend highlighting:

- Full-stack applications that demonstrate end-to-end implementation
- Projects showing your Python expertise, especially with data structures
- Any work showing problem-solving with algorithms
- Collaborative projects (if applicable)
- Projects relevant to the company's industry or technology stack`
      });
    }
  } catch (error) {
    console.error("Error creating sample user:", error);
  }
  
  // Auth Routes
  apiRouter.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, loginType } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password using crypto
      try {
        // Check if the stored password has salt (in the format hash.salt)
        if (user.password.includes('.')) {
          const [storedHash, salt] = user.password.split('.');
          const inputHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
          if (storedHash !== inputHash) {
            return res.status(401).json({ message: "Invalid credentials" });
          }
        } else {
          // For backward compatibility with non-hashed passwords
          if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
          }
        }
      } catch (error) {
        console.error("Password verification error:", error);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check user type based on the login type
      if (loginType) {
        if (loginType === "university" && user.userType === "regular") {
          return res.status(403).json({ message: "Access denied. This account is not associated with a university." });
        }
        
        // MODIFICATION: Allow university users to log in through the regular portal
        // This enables university students to access both portals with the same credentials
        // Original code blocked university users from using the regular login portal:
        // if (loginType === "regular" && (user.userType === "university_student" || user.userType === "university_admin")) {
        //   return res.status(403).json({ message: "Access denied. Please use the university login portal." });
        // }
        
        if (loginType === "admin" && user.userType !== "admin") {
          return res.status(403).json({ message: "Access denied. You do not have administrator privileges." });
        }
        
        if (loginType === "staff" && user.userType !== "staff" && user.userType !== "admin") {
          return res.status(403).json({ message: "Access denied. You do not have staff privileges." });
        }
      }
      
      // Set the user ID in session
      req.session.userId = user.id;
      
      // Set a cookie with the user ID
      res.cookie('userId', user.id, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        path: '/',
      });
      
      const { password: pwd, ...safeUser } = user;
      
      // Add redirect paths based on user role for frontend to handle
      let redirectPath;
      if (user.userType === "admin") {
        redirectPath = "/admin";
      } else if (user.userType === "staff") {
        redirectPath = "/staff";
      } else if (user.userType === "university_admin" || user.userType === "university_student") {
        redirectPath = "/university";
      } else {
        redirectPath = "/dashboard";
      }
      
      res.status(200).json({ user: safeUser, redirectPath });
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });
  
  apiRouter.post("/auth/logout", async (req: Request, res: Response) => {
    try {
      // Clear the session
      if (req.session) {
        req.session.userId = undefined;
        
        // Destroy the session
        req.session.destroy((err) => {
          if (err) {
            return res.status(500).json({ message: "Error destroying session" });
          }
          
          // Clear the cookie
          res.clearCookie('userId');
          res.clearCookie('connect.sid');
          
          // Set a special header to indicate logout for the client (for backward compatibility)
          res.setHeader('X-Auth-Logout', 'true');
          
          res.status(200).json({ message: "Logged out successfully" });
        });
      } else {
        // If there's no session, just clear the cookies
        res.clearCookie('userId');
        res.clearCookie('connect.sid');
        res.setHeader('X-Auth-Logout', 'true');
        res.status(200).json({ message: "Logged out successfully" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error during logout" });
    }
  });
  
  // Staff Registration endpoint
  // Only allow admins to create staff users
  apiRouter.post("/admin/create-staff", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { username, name, email, password } = req.body;
      
      // Validate required fields
      if (!username || !name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: "All fields are required"
        });
      }
      
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
      
      // Create the staff user with hashed password
      // Use crypto instead of bcrypt for password hashing
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      const securePassword = `${hashedPassword}.${salt}`;
        
      const newUser = await storage.createUser({
        username,
        email,
        name,
        password: securePassword, // Use securePassword with salt
        userType: "staff",
        profileImage: null,
        subscriptionStatus: "active",
        needsUsername: false
      });
      
      // Update user with additional fields
      await storage.updateUser(newUser.id, {
        xp: 0,
        level: 1,
        rank: "Beginner",
        subscriptionPlan: "pro",
        subscriptionCycle: "monthly",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        emailVerified: true
      });
      
      // Log the action
      console.log(`Admin ${req.session.userId} created staff user: ${newUser.id}`);
      
      // Return user without password
      const { password: pwd, ...safeUser } = newUser;
      
      return res.status(201).json({
        success: true,
        user: safeUser,
        message: "Staff user created successfully"
      });
    } catch (error) {
      console.error("Error creating staff user:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while creating staff user"
      });
    }
  });
  
  // Public staff registration endpoint (using registration code)
  apiRouter.post("/api/staff/register", async (req: Request, res: Response) => {
    const { username, name, email, password, registrationCode } = req.body;
    
    // Validate registration code (simple mechanism for demo)
    if (registrationCode !== 'STAFF2025') {
      return res.status(403).json({
        success: false, 
        message: "Invalid registration code" 
      });
    }
    
    try {
      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }
      
      // Check if email already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
      
      // Hash the password
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      const securePassword = `${hashedPassword}.${salt}`;
      
      // Create the staff user
      const newUser = await storage.createUser({
        username,
        email,
        name,
        password: securePassword, // Use hashed password
        userType: "staff",
        profileImage: null,
        // Only include fields that are in the insertUserSchema
        subscriptionStatus: "inactive",
        needsUsername: false
      });
      
      // Set user in session
      req.session.userId = newUser.id;
      
      // Return user without password
      const { password: pwd, ...safeUser } = newUser;
      
      return res.status(201).json({
        success: true,
        user: safeUser,
        redirectPath: "/staff" // Direct staff to staff dashboard
      });
    } catch (error) {
      console.error("Staff registration error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during registration"
      });
    }
  });
  
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      // Extract the raw data from request before validation
      const { email, name, password } = req.body;
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email address already in use" });
      }
      
      // Generate a temporary username from the email
      // Format: user_[first 8 chars of email hash]
      const emailHash = crypto.createHash('md5').update(email).digest('hex').substring(0, 8);
      const tempUsername = `user_${emailHash}`;
      
      // Prepare the user data with the temporary username and needsUsername flag
      const userData = {
        ...req.body,
        username: tempUsername,
        needsUsername: true,
        userType: req.body.userType || "regular"
      };
      
      // Validate with our schema after adding the required fields
      // Hash the password
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      const securePassword = `${hashedPassword}.${salt}`;
      
      // Replace the plain password with the hashed one
      userData.password = securePassword;
      
      const validatedUserData = insertUserSchema.parse(userData);
      
      // Validate university info for university users
      if (validatedUserData.userType === "university_student" || validatedUserData.userType === "university_admin") {
        if (!validatedUserData.universityId) {
          return res.status(400).json({ message: "University ID is required for university users" });
        }
        
        // If registering as university_admin, additional validation would be needed in a real app
        if (validatedUserData.userType === "university_admin") {
          // This would typically involve checking an admin registration code or admin email domain
          // For demo purposes, we're allowing it without additional checks
        }
      }
      
      const newUser = await storage.createUser(validatedUserData);
      const { password: userPwd, ...safeUser } = newUser;
      
      // Store user ID in session to log them in
      req.session.userId = newUser.id;
      
      // Set a cookie with the user ID
      res.cookie('userId', newUser.id, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        path: '/',
      });
      
      // Add redirect path for the frontend to handle
      let redirectPath = "/onboarding"; // Default for new users
      
      // Advanced logic can be added here if certain user types should go to different onboarding flows
      if (safeUser.userType === "university_admin" || safeUser.userType === "university_student") {
        redirectPath = "/university";
      }
      
      res.status(201).json({ user: safeUser, redirectPath });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });
  
  // Username validation and update endpoints
  apiRouter.get("/users/check-username", async (req: Request, res: Response) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username parameter is required" });
      }
      
      // Check if the username is valid format
      if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
        return res.status(400).json({ 
          message: "Username must be at least 3 characters and can only contain letters, numbers, and underscores",
          available: false
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      
      res.status(200).json({ available: !existingUser });
    } catch (error) {
      console.error("Error checking username availability:", error);
      res.status(500).json({ message: "Error checking username availability" });
    }
  });
  
  apiRouter.post("/users/update-username", requireAuth, async (req: Request, res: Response) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      // Check if the username is valid format
      if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
        return res.status(400).json({ 
          message: "Username must be at least 3 characters and can only contain letters, numbers, and underscores"
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Get current user
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Update the username and set needsUsername to false
      const updatedUser = await storage.updateUser(currentUser.id, { 
        username,
        needsUsername: false
      });
      
      // Check if user was updated successfully
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update username" });
      }
      
      // Remove password before sending response
      const { password: userPassword, ...safeUser } = updatedUser;
      
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({ message: "Error updating username" });
    }
  });
  
  // User Routes
  apiRouter.get("/users/me", async (req: Request, res: Response) => {
    try {
      // Check the authorization header
      const authHeader = req.headers.authorization;
      
      // Normally we would validate the auth header here
      // For demo purposes, we'll just check if the header exists
      // and always return the sample user
      
      // Check if the browser has a special logout flag set (from localStorage)
      const isLoggedOut = req.headers['x-auth-logout'] === 'true';
      if (isLoggedOut) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the user ID from the session
      let userId;
      
      // Try to get user ID from the session
      if (req.session && req.session.userId) {
        userId = req.session.userId;
      }
      
      // If we still don't have a user ID, use the default "alex" for backward compatibility
      let user;
      if (userId) {
        user = await storage.getUser(userId);
      }
      
      // If we couldn't find the user by ID, fall back to the default user
      if (!user) {
        user = await storage.getUserByUsername("alex");
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: userPassword, ...safeUser } = user;
      
      // Add password length for visual representation, but never send actual password
      const passwordLength = userPassword ? userPassword.length : 0;
      
      res.status(200).json({
        ...safeUser,
        passwordLength
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Update user profile
  apiRouter.put("/users/profile", async (req: Request, res: Response) => {
    try {
      // Get user ID from session
      let userId;
      if (req.session && req.session.userId) {
        userId = req.session.userId;
      }
      
      // Get the user by ID or fall back to default
      let user;
      if (userId) {
        user = await storage.getUser(userId);
      }
      
      // If not found, use the sample user for backward compatibility
      if (!user) {
        user = await storage.getUserByUsername("alex");
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update only allowed fields
      const updateData: Partial<User> = {};
      const { name, username, profileImage, email, currentPassword } = req.body;

      // Check if username already exists (if changed)
      if (username !== undefined && username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ 
            message: "Username already taken",
            field: "username"
          });
        }
      }
      
      // Handle name, username, and profileImage updates directly
      if (name !== undefined) updateData.name = name;
      if (username !== undefined) updateData.username = username;
      if (profileImage !== undefined) updateData.profileImage = profileImage;
      
      // Special handling for email changes
      if (email !== undefined && email !== user.email) {
        // Check if email already exists
        const userWithEmail = await storage.getUserByEmail(email);
        if (userWithEmail) {
          return res.status(400).json({ 
            message: "Email address already in use", 
            field: "email" 
          });
        }
        
        // For security, require current password to change email
        if (!currentPassword) {
          return res.status(400).json({ 
            message: "Current password is required to change email address" 
          });
        }
        
        // In a real app, validate the password here
        // For demo purposes, we'll assume the password is valid

        // Generate verification token and set expiration (24 hours)
        const verificationToken = Math.random().toString(36).substring(2, 15) + 
                                 Math.random().toString(36).substring(2, 15);
        const verificationExpires = new Date();
        verificationExpires.setHours(verificationExpires.getHours() + 24);
        
        // Store the pending email change
        updateData.pendingEmail = email;
        updateData.pendingEmailToken = verificationToken;
        updateData.pendingEmailExpires = verificationExpires;
        
        // In a real app, send verification email to the new address
        console.log(`Verification link would be sent to ${email} with token: ${verificationToken}`);
      }
      
      // Apply the updates
      const updatedUser = await storage.updateUser(user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user" });
      }
      
      const { password: userPassword, ...safeUser } = updatedUser;
      
      // Add a message about email verification if needed
      if (updateData.pendingEmail) {
        return res.status(200).json({
          ...safeUser,
          message: "A verification email has been sent to your new email address. Please check your inbox to complete the email change."
        });
      }
      
      res.status(200).json(safeUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Error updating user profile" });
    }
  });
  
  apiRouter.get("/users/statistics", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const stats = await storage.getUserStatistics(user.id);
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching statistics" });
    }
  });
  
  apiRouter.get("/users/xp-history", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user is a university user
      const isUniversityUser = user.userType === "university_student" || user.userType === "university_admin";
      
      // Only return XP history for university users
      if (isUniversityUser) {
        const xpHistory = await storage.getXpHistory(user.id);
        res.status(200).json(xpHistory);
      } else {
        // For regular users, return an empty array
        res.status(200).json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching XP history" });
    }
  });
  
  // Goal Routes
  apiRouter.get("/goals", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const goals = await storage.getGoals(user.id);
      res.status(200).json(goals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching goals" });
    }
  });
  
  apiRouter.post("/goals", requireAuth, async (req: Request, res: Response) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const goal = await storage.createGoal(user.id, goalData);
      res.status(201).json(goal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid goal data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating goal" });
    }
  });
  
  apiRouter.put("/goals/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goalId = parseInt(id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Ensure the goal belongs to the current user
      if (goal.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this goal" });
      }
      
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      res.status(200).json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Error updating goal" });
    }
  });
  
  apiRouter.delete("/goals/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goalId = parseInt(id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // Ensure the goal belongs to the current user
      if (goal.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this goal" });
      }
      
      await storage.deleteGoal(goalId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting goal" });
    }
  });
  
  apiRouter.post("/goals/suggest", async (req: Request, res: Response) => {
    try {
      const { currentPosition, desiredPosition, timeframe, skills } = req.body;
      
      if (!currentPosition || !desiredPosition || !timeframe || !skills) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const goalSuggestions = await suggestCareerGoals(
        currentPosition,
        desiredPosition,
        timeframe,
        skills
      );
      
      res.status(200).json(goalSuggestions);
    } catch (error) {
      res.status(500).json({ message: "Error generating goal suggestions" });
    }
  });
  
  // Work History Routes
  apiRouter.get("/work-history", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const workHistory = await storage.getWorkHistory(user.id);
      res.status(200).json(workHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching work history" });
    }
  });
  
  apiRouter.post("/work-history", requireAuth, async (req: Request, res: Response) => {
    try {
      const workHistoryData = insertWorkHistorySchema.parse(req.body);
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const workHistoryItem = await storage.createWorkHistoryItem(user.id, workHistoryData);
      res.status(201).json(workHistoryItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid work history data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating work history item" });
    }
  });
  
  apiRouter.put("/work-history/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const itemId = parseInt(id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid work history ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const item = await storage.getWorkHistoryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Work history item not found" });
      }
      
      // Ensure the work history item belongs to the current user
      if (item.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this work history item" });
      }
      
      const updatedItem = await storage.updateWorkHistoryItem(itemId, req.body);
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating work history item" });
    }
  });
  
  apiRouter.delete("/work-history/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const itemId = parseInt(id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid work history ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const item = await storage.getWorkHistoryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Work history item not found" });
      }
      
      // Ensure the work history item belongs to the current user
      if (item.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this work history item" });
      }
      
      await storage.deleteWorkHistoryItem(itemId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting work history item" });
    }
  });
  
  // Resume Routes
  apiRouter.get("/resumes", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const resumes = await storage.getResumes(user.id);
      res.status(200).json(resumes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resumes" });
    }
  });
  
  apiRouter.get("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resumeId = parseInt(id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Ensure the resume belongs to the current user
      if (resume.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access this resume" });
      }
      
      res.status(200).json(resume);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resume" });
    }
  });
  
  apiRouter.post("/resumes", requireAuth, async (req: Request, res: Response) => {
    try {
      const resumeData = insertResumeSchema.parse(req.body);
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const resume = await storage.createResume(user.id, resumeData);
      res.status(201).json(resume);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid resume data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating resume" });
    }
  });
  
  apiRouter.put("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resumeId = parseInt(id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Ensure the resume belongs to the current user
      if (resume.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this resume" });
      }
      
      const updatedResume = await storage.updateResume(resumeId, req.body);
      res.status(200).json(updatedResume);
    } catch (error) {
      res.status(500).json({ message: "Error updating resume" });
    }
  });
  
  apiRouter.delete("/resumes/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resumeId = parseInt(id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Ensure the resume belongs to the current user
      if (resume.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this resume" });
      }
      
      await storage.deleteResume(resumeId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting resume" });
    }
  });
  
  apiRouter.post("/resumes/suggestions", async (req: Request, res: Response) => {
    try {
      const { workHistory, jobDescription } = req.body;
      
      if (!workHistory || !jobDescription) {
        return res.status(400).json({ message: "Work history and job description are required" });
      }
      
      const suggestions = await generateResumeSuggestions(workHistory, jobDescription);
      res.status(200).json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Error generating resume suggestions" });
    }
  });
  
  // Cover Letter Routes
  apiRouter.get("/cover-letters", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const coverLetters = await storage.getCoverLetters(user.id);
      res.status(200).json(coverLetters);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cover letters" });
    }
  });
  
  apiRouter.get("/cover-letters/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const letterId = parseInt(id);
      
      if (isNaN(letterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // Ensure the cover letter belongs to the current user
      if (letter.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access this cover letter" });
      }
      
      res.status(200).json(letter);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cover letter" });
    }
  });
  
  apiRouter.post("/cover-letters", requireAuth, async (req: Request, res: Response) => {
    try {
      const letterData = insertCoverLetterSchema.parse(req.body);
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const letter = await storage.createCoverLetter(user.id, letterData);
      res.status(201).json(letter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cover letter data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating cover letter" });
    }
  });
  
  apiRouter.put("/cover-letters/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const letterId = parseInt(id);
      
      if (isNaN(letterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // Ensure the cover letter belongs to the current user
      if (letter.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this cover letter" });
      }
      
      const updatedLetter = await storage.updateCoverLetter(letterId, req.body);
      res.status(200).json(updatedLetter);
    } catch (error) {
      res.status(500).json({ message: "Error updating cover letter" });
    }
  });
  
  apiRouter.delete("/cover-letters/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const letterId = parseInt(id);
      
      if (isNaN(letterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // Ensure the cover letter belongs to the current user
      if (letter.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this cover letter" });
      }
      
      await storage.deleteCoverLetter(letterId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting cover letter" });
    }
  });
  
  apiRouter.post("/cover-letters/generate", async (req: Request, res: Response) => {
    try {
      const { jobTitle, companyName, jobDescription, userExperience, userSkills } = req.body;
      
      if (!jobTitle || !companyName || !jobDescription || !userExperience || !userSkills) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const coverLetter = await generateCoverLetter(
        jobTitle,
        companyName,
        jobDescription,
        userExperience,
        userSkills
      );
      
      res.status(200).json({ content: coverLetter });
    } catch (error) {
      res.status(500).json({ message: "Error generating cover letter" });
    }
  });
  
  // Interview Routes
  apiRouter.get("/api/interview/questions", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const questions = await storage.getInterviewQuestions(category as string | undefined);
      res.status(200).json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching interview questions" });
    }
  });
  
  apiRouter.post("/api/interview/practice", requireAuth, async (req: Request, res: Response) => {
    try {
      const practiceData = insertInterviewPracticeSchema.parse(req.body);
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const practice = await storage.saveInterviewPractice(user.id, practiceData);
      res.status(201).json(practice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid practice data", errors: error.errors });
      }
      res.status(500).json({ message: "Error saving interview practice" });
    }
  });
  
  apiRouter.get("/api/interview/practice-history", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const practiceHistory = await storage.getUserInterviewPractice(user.id);
      res.status(200).json(practiceHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching practice history" });
    }
  });
  
  apiRouter.post("/api/interview/generate-questions", async (req: Request, res: Response) => {
    try {
      const { jobTitle, skills } = req.body;
      
      if (!jobTitle || !skills) {
        return res.status(400).json({ message: "Job title and skills are required" });
      }
      
      const questions = await generateInterviewQuestions(jobTitle, skills);
      res.status(200).json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error generating interview questions" });
    }
  });
  
  // Achievement Routes
  apiRouter.get("/achievements", async (req: Request, res: Response) => {
    try {
      const achievements = await storage.getAchievements();
      res.status(200).json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching achievements" });
    }
  });
  
  apiRouter.get("/achievements/user", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userAchievements = await storage.getUserAchievements(user.id);
      res.status(200).json(userAchievements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user achievements" });
    }
  });
  
  // Career Mentor Routes
  apiRouter.get("/mentor-chat/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const conversations = await storage.getMentorChatConversations(user.id);
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching mentor conversations" });
    }
  });
  
  apiRouter.post("/mentor-chat/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { title, category, mentorPersona } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const conversation = await storage.createMentorChatConversation(user.id, { 
        title,
        category: category || "general",
        mentorPersona: mentorPersona || "career_coach" 
      });
      
      // Add initial AI message based on persona
      let welcomeMessage = "Hello! I'm your career mentor. How can I help you today?";
      
      switch(mentorPersona) {
        case 'interviewer':
          welcomeMessage = "Hi there! I'm your interview specialist. I can help you prepare for interviews, practice responses, and develop strategies to impress potential employers. What would you like to discuss today?";
          break;
        case 'industry_expert':
          welcomeMessage = "Hello! I'm your industry advisor. I can provide insights about industry trends, company cultures, and market demands. What industry questions can I help with today?";
          break;
        case 'resume_expert':
          welcomeMessage = "Welcome! I specialize in resume and cover letter optimization. I can help you craft compelling documents that highlight your strengths and catch recruiters' attention. How can I assist with your application materials?";
          break;
        default:
          welcomeMessage = "Hello! I'm your career coach and mentor. I'm here to guide you through your professional journey with personalized advice and actionable strategies. What's on your mind today?";
      }
      
      await storage.addMentorChatMessage({
        conversationId: conversation.id,
        isUser: false,
        message: welcomeMessage,
        role: "assistant"
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Error creating mentor conversation" });
    }
  });
  
  apiRouter.get("/mentor-chat/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const conversation = await storage.getMentorChatConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Ensure the conversation belongs to the current user
      if (conversation.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access this conversation" });
      }
      
      const messages = await storage.getMentorChatMessages(conversationId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching mentor messages" });
    }
  });
  
  apiRouter.post("/mentor-chat/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const conversation = await storage.getMentorChatConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Ensure the conversation belongs to the current user
      if (conversation.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access this conversation" });
      }
      
      // Add user message
      const userMessage = await storage.addMentorChatMessage({
        conversationId,
        isUser: true,
        message,
        role: "user"
      });
      
      // Get relevant user context for the AI
      const goals = await storage.getGoals(user.id);
      const workHistoryItems = await storage.getWorkHistory(user.id);
      
      const userContext = {
        goals: goals.map(g => g.title),
        workHistory: workHistoryItems.map(w => `${w.position} at ${w.company}`)
      };
      
      // Get AI response based on mentor persona
      const aiResponse = await getCareerAdvice(message, userContext);
      
      // Add AI message
      const aiMessage = await storage.addMentorChatMessage({
        conversationId,
        isUser: false,
        message: aiResponse,
        role: "assistant"
      });
      
      res.status(201).json([userMessage, aiMessage]);
    } catch (error) {
      res.status(500).json({ message: "Error adding mentor message" });
    }
  });
  
  // AI Coach Routes
  apiRouter.get("/ai-coach/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const conversations = await storage.getAiCoachConversations(user.id);
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching conversations" });
    }
  });
  
  apiRouter.post("/ai-coach/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const conversation = await storage.createAiCoachConversation(user.id, { title });
      
      // Add initial AI message
      await storage.addAiCoachMessage({
        conversationId: conversation.id,
        isUser: false,
        message: "Hello! I'm your AI career coach. How can I help you today with your career goals?"
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Error creating conversation" });
    }
  });
  
  apiRouter.get("/ai-coach/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const conversation = await storage.getAiCoachConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Ensure the conversation belongs to the current user
      if (conversation.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access this conversation" });
      }
      
      const messages = await storage.getAiCoachMessages(conversationId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });
  
  apiRouter.post("/ai-coach/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const conversation = await storage.getAiCoachConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Ensure the conversation belongs to the current user
      if (conversation.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access this conversation" });
      }
      
      // Add user message
      const userMessage = await storage.addAiCoachMessage({
        conversationId,
        isUser: true,
        message
      });
      
      const goals = await storage.getGoals(user.id);
      const workHistoryItems = await storage.getWorkHistory(user.id);
      
      const userContext = {
        goals: goals.map(g => g.title),
        workHistory: workHistoryItems.map(w => `${w.position} at ${w.company}`)
      };
      
      // Get AI response
      const aiResponse = await getCareerAdvice(message, userContext);
      
      // Add AI message
      const aiMessage = await storage.addAiCoachMessage({
        conversationId,
        isUser: false,
        message: aiResponse
      });
      
      res.status(201).json([userMessage, aiMessage]);
    } catch (error) {
      res.status(500).json({ message: "Error adding message" });
    }
  });
  
  // Register all routes with /api prefix
  app.use("/api", apiRouter);
  
  // Interview Process Tracking Routes
  apiRouter.get("/api/interview/processes", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const processes = await storage.getInterviewProcesses(user.id);
      res.status(200).json(processes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching interview processes" });
    }
  });
  
  apiRouter.post("/api/interview/processes", requireAuth, async (req: Request, res: Response) => {
    try {
      const processData = insertInterviewProcessSchema.parse(req.body);
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const process = await storage.createInterviewProcess(user.id, processData);
      res.status(201).json(process);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interview process data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating interview process" });
    }
  });
  
  apiRouter.get("/api/interview/processes/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const processId = parseInt(id);
      
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const process = await storage.getInterviewProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access this interview process" });
      }
      
      res.status(200).json(process);
    } catch (error) {
      res.status(500).json({ message: "Error fetching interview process" });
    }
  });
  
  apiRouter.put("/api/interview/processes/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const processId = parseInt(id);
      
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const process = await storage.getInterviewProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this interview process" });
      }
      
      const updatedProcess = await storage.updateInterviewProcess(processId, req.body);
      res.status(200).json(updatedProcess);
    } catch (error) {
      res.status(500).json({ message: "Error updating interview process" });
    }
  });
  
  apiRouter.delete("/api/interview/processes/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const processId = parseInt(id);
      
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const process = await storage.getInterviewProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this interview process" });
      }
      
      await storage.deleteInterviewProcess(processId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting interview process" });
    }
  });
  
  // Interview Stage Routes
  apiRouter.get("/api/interview/processes/:processId/stages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access stages for this interview process" });
      }
      
      const stages = await storage.getInterviewStages(processIdNum);
      res.status(200).json(stages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching interview stages" });
    }
  });
  
  apiRouter.post("/api/interview/processes/:processId/stages", requireAuth, async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      
      console.log(`Adding stage to process ID: ${processId}, parsed as: ${processIdNum}`);
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log(`User ID: ${user.id}, looking for process with ID: ${processIdNum}`);
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      console.log(`Process found:`, process ? `ID: ${process.id}, Company: ${process.companyName}` : 'Process not found');
      
      if (!process) {
        return res.status(400).json({ message: "Invalid interview process" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to add stages to this interview process" });
      }
      
      console.log(`Stage data before parsing:`, req.body);
      const stageData = insertInterviewStageSchema.parse(req.body);
      console.log(`Stage data after parsing:`, stageData);
      
      const stage = await storage.createInterviewStage(processIdNum, stageData);
      res.status(201).json(stage);
    } catch (error) {
      console.error("Error adding interview stage:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interview stage data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating interview stage" });
    }
  });
  
  apiRouter.put("/api/interview/stages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stageId = parseInt(id);
      
      if (isNaN(stageId)) {
        return res.status(400).json({ message: "Invalid stage ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const stage = await storage.getInterviewStage(stageId);
      
      if (!stage) {
        return res.status(404).json({ message: "Interview stage not found" });
      }
      
      // Get the process to check ownership
      const process = await storage.getInterviewProcess(stage.processId);
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this interview stage" });
      }
      
      const updatedStage = await storage.updateInterviewStage(stageId, req.body);
      res.status(200).json(updatedStage);
    } catch (error) {
      res.status(500).json({ message: "Error updating interview stage" });
    }
  });
  
  apiRouter.delete("/api/interview/stages/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stageId = parseInt(id);
      
      if (isNaN(stageId)) {
        return res.status(400).json({ message: "Invalid stage ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const stage = await storage.getInterviewStage(stageId);
      
      if (!stage) {
        return res.status(404).json({ message: "Interview stage not found" });
      }
      
      // Get the process to check ownership
      const process = await storage.getInterviewProcess(stage.processId);
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this interview stage" });
      }
      
      await storage.deleteInterviewStage(stageId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting interview stage" });
    }
  });
  
  // Followup Action Routes
  apiRouter.get("/api/interview/processes/:processId/followups", requireAuth, async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      const { stageId } = req.query;
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to access followups for this interview process" });
      }
      
      let stageIdNum: number | undefined = undefined;
      if (stageId && typeof stageId === 'string') {
        stageIdNum = parseInt(stageId);
        if (isNaN(stageIdNum)) {
          return res.status(400).json({ message: "Invalid stage ID" });
        }
      }
      
      const actions = await storage.getFollowupActions(processIdNum, stageIdNum);
      res.status(200).json(actions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching followup actions" });
    }
  });
  
  apiRouter.post("/api/interview/processes/:processId/followups", requireAuth, async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to add followups to this interview process" });
      }
      
      const actionData = insertFollowupActionSchema.parse(req.body);
      const action = await storage.createFollowupAction(processIdNum, actionData);
      res.status(201).json(action);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid followup action data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating followup action" });
    }
  });
  
  apiRouter.put("/api/interview/followup-actions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actionId = parseInt(id);
      
      if (isNaN(actionId)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const action = await storage.getFollowupAction(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Followup action not found" });
      }
      
      // Get the process to check ownership
      const process = await storage.getInterviewProcess(action.processId);
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to update this followup action" });
      }
      
      const updatedAction = await storage.updateFollowupAction(actionId, req.body);
      res.status(200).json(updatedAction);
    } catch (error) {
      res.status(500).json({ message: "Error updating followup action" });
    }
  });
  
  apiRouter.put("/api/interview/followup-actions/:id/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actionId = parseInt(id);
      
      if (isNaN(actionId)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const action = await storage.getFollowupAction(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Followup action not found" });
      }
      
      // Get the process to check ownership
      const process = await storage.getInterviewProcess(action.processId);
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to complete this followup action" });
      }
      
      const completedAction = await storage.completeFollowupAction(actionId);
      res.status(200).json(completedAction);
    } catch (error) {
      res.status(500).json({ message: "Error completing followup action" });
    }
  });
  
  apiRouter.delete("/api/interview/followup-actions/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actionId = parseInt(id);
      
      if (isNaN(actionId)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const action = await storage.getFollowupAction(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Followup action not found" });
      }
      
      // Get the process to check ownership
      const process = await storage.getInterviewProcess(action.processId);
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      // Ensure the process belongs to the current user
      if (process.userId !== user.id) {
        return res.status(403).json({ message: "You don't have permission to delete this followup action" });
      }
      
      await storage.deleteFollowupAction(actionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting followup action" });
    }
  });

  // Contact form endpoints
  apiRouter.post("/contact", async (req: Request, res: Response) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      
      const contactMessage = await storage.createContactMessage(validatedData);
      
      res.status(201).json({
        success: true,
        message: "Contact message sent successfully",
        id: contactMessage.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error submitting contact message:", error);
      res.status(500).json({ message: "Failed to submit contact message" });
    }
  });

  // Staff contact message management endpoints
  apiRouter.get("/contact/messages", requireStaff, async (req: Request, res: Response) => {
    try {
      const messages = await storage.getContactMessages();
      res.status(200).json(messages);
    } catch (error) {
      console.error("Error retrieving contact messages:", error);
      res.status(500).json({ message: "Failed to retrieve contact messages" });
    }
  });

  apiRouter.put("/contact/messages/:id/read", requireStaff, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.markContactMessageAsRead(id);
      
      if (!message) {
        return res.status(404).json({ message: "Contact message not found" });
      }
      
      res.status(200).json({ 
        success: true,
        message: "Contact message marked as read"
      });
    } catch (error) {
      console.error("Error marking contact message as read:", error);
      res.status(500).json({ message: "Failed to mark contact message as read" });
    }
  });

  apiRouter.put("/contact/messages/:id/archive", requireStaff, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const message = await storage.markContactMessageAsArchived(id);
      
      if (!message) {
        return res.status(404).json({ message: "Contact message not found" });
      }
      
      res.status(200).json({ 
        success: true,
        message: "Contact message archived"
      });
    } catch (error) {
      console.error("Error archiving contact message:", error);
      res.status(500).json({ message: "Failed to archive contact message" });
    }
  });

  // System Status Routes
  apiRouter.get("/system/status", async (req: Request, res: Response) => {
    try {
      // Get current system metrics
      const systemMetrics = await storage.getSystemMetrics();
      const componentStatus = await storage.getComponentStatus();
      const recentAlerts = await storage.getRecentAlerts();
      
      res.status(200).json({
        overall: systemMetrics,
        components: componentStatus,
        alerts: recentAlerts
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching system status" });
    }
  });

  // Mount the API router to the Express app
  // Payment and Subscription Routes
  apiRouter.post("/payments/create-payment-intent", async (req: Request, res: Response) => {
    try {
      const data = createPaymentIntentSchema.parse(req.body);
      const result = await createPaymentIntent(data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  apiRouter.post("/payments/create-subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const data = createSubscriptionSchema.parse({
        ...req.body,
        userId: user.id,
        userName: user.name,
        email: user.email
      });
      
      const result = await createSubscription(data);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  apiRouter.post("/payments/webhook", express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'];
      
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).json({ error: 'Missing signature or webhook secret' });
      }
      
      let event;
      try {
        // Verify webhook signature using imported instance
        event = stripe.webhooks.constructEvent(
          req.body,
          sig as string,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
      }
      
      // Handle the event
      if (event.type === 'customer.subscription.updated' || 
          event.type === 'customer.subscription.created') {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription.id);
      }
      
      res.status(200).json({ received: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  apiRouter.get("/payments/payment-methods", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const paymentMethods = await getUserPaymentMethods(user.id);
      res.status(200).json(paymentMethods);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  apiRouter.post("/payments/create-setup-intent", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const setupIntent = await createSetupIntent(user.id);
      res.status(200).json(setupIntent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  apiRouter.post("/payments/cancel-subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const result = await cancelSubscription(user.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Email verification routes
  apiRouter.post("/auth/send-verification-email", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const token = await generateEmailVerificationToken(user.id, user.email);
      
      // In a real app, send email with verification link
      // For demo purposes, just return the token
      res.status(200).json({ 
        message: "Verification email sent",
        // Only in development, to simulate clicking the link
        verificationUrl: `/verify-email?token=${token}`
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Send verification email for email address change
  apiRouter.post("/auth/send-email-change-verification", requireAuth, async (req: Request, res: Response) => {
    try {
      const { email, currentPassword } = req.body;
      
      // Validate the new email
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // In a real app, validate the provided current password
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      
      // Check if the new email is different from the current one
      if (email === user.email) {
        return res.status(400).json({ error: 'New email is the same as the current email' });
      }
      
      // Generate a verification token
      const token = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      // Set token expiration to 24 hours
      const tokenExpires = new Date();
      tokenExpires.setHours(tokenExpires.getHours() + 24);
      
      // Store the pending email change
      await storage.updateUser(user.id, {
        pendingEmail: email,
        pendingEmailToken: token,
        pendingEmailExpires: tokenExpires
      });
      
      // In a real app, send verification email to the new address
      
      // For demo purposes, return the token
      res.status(200).json({
        message: `Verification email sent to ${email}. Please check your inbox to confirm the change.`,
        // Only in development, to simulate clicking the link
        verificationUrl: `/verify-email-change?token=${token}`
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  apiRouter.get("/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid token' });
      }
      
      const result = await verifyEmail(token);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Endpoint to change user password
  apiRouter.post("/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      
      // Get current user from session
      const user = await getCurrentUser(req);
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // For demo purposes only: if "Vinnie12!" is sent, allow the change
      // In a real application, we would verify the current password against a hashed value
      if (currentPassword !== "password" && currentPassword !== "Vinnie12!") {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Update the user's password
      const updatedUser = await storage.updateUserPassword(user.id, newPassword);
      
      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update password' });
      }
      
      // Calculate password length for display purposes without revealing the actual password
      const passwordLength = newPassword.length;
      
      // Send the updated user back
      res.status(200).json({ 
        message: 'Password updated successfully',
        user: {
          ...user,
          password: undefined, // Don't send password to client
          passwordLastChanged: new Date(),
          passwordLength: passwordLength // Include password length for display
        }
      });
    } catch (error) {
      console.error('Error in change-password:', error);
      res.status(500).json({ error: 'An error occurred while changing password' });
    }
  });
  
  // Endpoint to verify and confirm email changes
  apiRouter.get("/auth/verify-email-change", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid token' });
      }
      
      // Find user with this pending email token
      const user = await storage.getUserByPendingEmailToken(token);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found or invalid token' });
      }
      
      // Check if token is expired
      if (user.pendingEmailExpires && new Date(user.pendingEmailExpires) < new Date()) {
        return res.status(400).json({ error: 'Verification token has expired' });
      }
      
      if (!user.pendingEmail) {
        return res.status(400).json({ error: 'No pending email change found' });
      }
      
      // Update user's email
      const updatedUser = await storage.updateUser(user.id, {
        email: user.pendingEmail,
        emailVerified: true,
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpires: null
      });
      
      if (!updatedUser) {
        return res.status(500).json({ error: 'Failed to update email' });
      }
      
      res.status(200).json({ 
        success: true,
        message: `Email successfully updated to ${updatedUser.email}`
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Recommendations API
  apiRouter.get("/recommendations", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get all recommendations for the user
      const recommendations = await storage.getRecommendations(user.id);
      res.status(200).json(recommendations);
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Error fetching recommendations", error: error.message });
    }
  });
  
  apiRouter.get("/recommendations/daily", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if a refresh is requested
      const shouldRefresh = req.query.refresh === 'true';
      
      if (shouldRefresh) {
        // If refresh is requested, clear today's recommendations first
        await storage.clearTodaysRecommendations(user.id);
      }
      
      // Generate or get today's recommendations
      const recommendations = await storage.generateDailyRecommendations(user.id);
      res.status(200).json(recommendations);
    } catch (error: any) {
      console.error("Error generating daily recommendations:", error);
      res.status(500).json({ message: "Error generating daily recommendations", error: error.message });
    }
  });
  
  apiRouter.post("/recommendations/:id/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await getCurrentUser(req);
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const recommendationId = parseInt(req.params.id);
      if (isNaN(recommendationId)) {
        return res.status(400).json({ message: "Invalid recommendation ID" });
      }
      
      // Get the recommendation to verify ownership
      const recommendation = await storage.getRecommendation(recommendationId);
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      
      // Check if the recommendation belongs to the current user
      if (recommendation.userId !== user.id) {
        return res.status(403).json({ message: "Access denied. You can only update your own recommendations." });
      }
      
      // Complete the recommendation
      const completedRecommendation = await storage.completeRecommendation(recommendationId);
      if (!completedRecommendation) {
        return res.status(500).json({ message: "Failed to complete recommendation" });
      }
      
      res.status(200).json(completedRecommendation);
    } catch (error: any) {
      console.error("Error completing recommendation:", error);
      res.status(500).json({ message: "Error completing recommendation", error: error.message });
    }
  });

  app.use(apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
