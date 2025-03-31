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
  type User
} from "@shared/schema";
import { getCareerAdvice, generateResumeSuggestions, generateCoverLetter, generateInterviewQuestions, suggestCareerGoals } from "./openai";
import { createPaymentIntent, createPaymentIntentSchema, createSubscription, createSubscriptionSchema, handleSubscriptionUpdated, cancelSubscription, generateEmailVerificationToken, verifyEmail, createSetupIntent, getUserPaymentMethods, stripe } from "./services/stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  const apiRouter = express.Router();
  
  // Create a sample user at startup (for demo purposes)
  try {
    const existingUser = await storage.getUserByUsername("alex");
    if (!existingUser) {
      const sampleUser = await storage.createUser({
        username: "alex",
        password: "password",
        name: "Alex Johnson",
        email: "alex@example.com",
        userType: "university_student",
        universityId: 1,
        departmentId: 2,
        studentId: "U12345",
        graduationYear: 2025,
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=300&h=300&q=80",
        subscriptionStatus: "active",
        stripeCustomerId: "cus_mock123",
        stripeSubscriptionId: "sub_mock123",
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
      
      // Add some XP to the user
      await storage.addUserXP(sampleUser.id, 2450, "initial_setup", "Initial user setup");
      
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
      const { username, password, loginType } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Check if username is an email address (contains @ symbol)
      let user;
      if (username.includes('@')) {
        user = await storage.getUserByEmail(username);
      } else {
        user = await storage.getUserByUsername(username);
      }
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check user type based on the login type
      if (loginType) {
        if (loginType === "university" && user.userType === "regular") {
          return res.status(403).json({ message: "Access denied. This account is not associated with a university." });
        }
        
        if (loginType === "regular" && (user.userType === "university_student" || user.userType === "university_admin")) {
          return res.status(403).json({ message: "Access denied. Please use the university login portal." });
        }
      }
      
      // For a real app, you would create a session here
      const { password: pwd, ...safeUser } = user;
      
      res.status(200).json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ message: "Error during login" });
    }
  });
  
  apiRouter.post("/auth/logout", async (req: Request, res: Response) => {
    try {
      // In a real app with sessions, you would destroy the session here
      // We'll set a special header to indicate logout for the client
      res.setHeader('X-Auth-Logout', 'true');
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error during logout" });
    }
  });
  
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email address already in use" });
      }
      
      // Set the user type based on registration form or defaults to "regular"
      if (!userData.userType) {
        userData.userType = "regular";
      }
      
      // Validate university info for university users
      if (userData.userType === "university_student" || userData.userType === "university_admin") {
        if (!userData.universityId) {
          return res.status(400).json({ message: "University ID is required for university users" });
        }
        
        // If registering as university_admin, additional validation would be needed in a real app
        if (userData.userType === "university_admin") {
          // This would typically involve checking an admin registration code or admin email domain
          // For demo purposes, we're allowing it without additional checks
        }
      }
      
      const newUser = await storage.createUser(userData);
      const { password: userPwd, ...safeUser } = newUser;
      
      res.status(201).json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
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
      
      // For demo purposes, we're using the sample user
      // In a real app, you would extract the user ID from the session
      const user = await storage.getUserByUsername("alex");
      
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
      // In a real app, you would get the user ID from the session
      // For demo purposes, we'll use the sample user
      const user = await storage.getUserByUsername("alex");
      
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
      
      const xpHistory = await storage.getXpHistory(user.id);
      res.status(200).json(xpHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching XP history" });
    }
  });
  
  // Goal Routes
  apiRouter.get("/goals", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const goals = await storage.getGoals(user.id);
      res.status(200).json(goals);
    } catch (error) {
      res.status(500).json({ message: "Error fetching goals" });
    }
  });
  
  apiRouter.post("/goals", async (req: Request, res: Response) => {
    try {
      const goalData = insertGoalSchema.parse(req.body);
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.put("/goals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goalId = parseInt(id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // For demo purposes, we don't check if the goal belongs to the user
      const updatedGoal = await storage.updateGoal(goalId, req.body);
      res.status(200).json(updatedGoal);
    } catch (error) {
      res.status(500).json({ message: "Error updating goal" });
    }
  });
  
  apiRouter.delete("/goals/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const goalId = parseInt(id);
      
      if (isNaN(goalId)) {
        return res.status(400).json({ message: "Invalid goal ID" });
      }
      
      const goal = await storage.getGoal(goalId);
      
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      // For demo purposes, we don't check if the goal belongs to the user
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
  apiRouter.get("/work-history", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const workHistory = await storage.getWorkHistory(user.id);
      res.status(200).json(workHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching work history" });
    }
  });
  
  apiRouter.post("/work-history", async (req: Request, res: Response) => {
    try {
      const workHistoryData = insertWorkHistorySchema.parse(req.body);
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.put("/work-history/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const itemId = parseInt(id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid work history ID" });
      }
      
      const item = await storage.getWorkHistoryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Work history item not found" });
      }
      
      // For demo purposes, we don't check if the item belongs to the user
      const updatedItem = await storage.updateWorkHistoryItem(itemId, req.body);
      res.status(200).json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating work history item" });
    }
  });
  
  apiRouter.delete("/work-history/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const itemId = parseInt(id);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid work history ID" });
      }
      
      const item = await storage.getWorkHistoryItem(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Work history item not found" });
      }
      
      // For demo purposes, we don't check if the item belongs to the user
      await storage.deleteWorkHistoryItem(itemId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting work history item" });
    }
  });
  
  // Resume Routes
  apiRouter.get("/resumes", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const resumes = await storage.getResumes(user.id);
      res.status(200).json(resumes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resumes" });
    }
  });
  
  apiRouter.get("/resumes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resumeId = parseInt(id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // For demo purposes, we don't check if the resume belongs to the user
      res.status(200).json(resume);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resume" });
    }
  });
  
  apiRouter.post("/resumes", async (req: Request, res: Response) => {
    try {
      const resumeData = insertResumeSchema.parse(req.body);
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.put("/resumes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resumeId = parseInt(id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // For demo purposes, we don't check if the resume belongs to the user
      const updatedResume = await storage.updateResume(resumeId, req.body);
      res.status(200).json(updatedResume);
    } catch (error) {
      res.status(500).json({ message: "Error updating resume" });
    }
  });
  
  apiRouter.delete("/resumes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resumeId = parseInt(id);
      
      if (isNaN(resumeId)) {
        return res.status(400).json({ message: "Invalid resume ID" });
      }
      
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // For demo purposes, we don't check if the resume belongs to the user
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
  apiRouter.get("/cover-letters", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const coverLetters = await storage.getCoverLetters(user.id);
      res.status(200).json(coverLetters);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cover letters" });
    }
  });
  
  apiRouter.get("/cover-letters/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const letterId = parseInt(id);
      
      if (isNaN(letterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // For demo purposes, we don't check if the letter belongs to the user
      res.status(200).json(letter);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cover letter" });
    }
  });
  
  apiRouter.post("/cover-letters", async (req: Request, res: Response) => {
    try {
      const letterData = insertCoverLetterSchema.parse(req.body);
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.put("/cover-letters/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const letterId = parseInt(id);
      
      if (isNaN(letterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // For demo purposes, we don't check if the letter belongs to the user
      const updatedLetter = await storage.updateCoverLetter(letterId, req.body);
      res.status(200).json(updatedLetter);
    } catch (error) {
      res.status(500).json({ message: "Error updating cover letter" });
    }
  });
  
  apiRouter.delete("/cover-letters/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const letterId = parseInt(id);
      
      if (isNaN(letterId)) {
        return res.status(400).json({ message: "Invalid cover letter ID" });
      }
      
      const letter = await storage.getCoverLetter(letterId);
      
      if (!letter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }
      
      // For demo purposes, we don't check if the letter belongs to the user
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
  
  apiRouter.post("/api/interview/practice", async (req: Request, res: Response) => {
    try {
      const practiceData = insertInterviewPracticeSchema.parse(req.body);
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.get("/api/interview/practice-history", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.get("/achievements/user", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userAchievements = await storage.getUserAchievements(user.id);
      res.status(200).json(userAchievements);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user achievements" });
    }
  });
  
  // AI Coach Routes
  apiRouter.get("/ai-coach/conversations", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const conversations = await storage.getAiCoachConversations(user.id);
      res.status(200).json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching conversations" });
    }
  });
  
  apiRouter.post("/ai-coach/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.get("/ai-coach/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const conversation = await storage.getAiCoachConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // For demo purposes, we don't check if the conversation belongs to the user
      const messages = await storage.getAiCoachMessages(conversationId);
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching messages" });
    }
  });
  
  apiRouter.post("/ai-coach/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const conversation = await storage.getAiCoachConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // For demo purposes, we don't check if the conversation belongs to the user
      
      // Add user message
      const userMessage = await storage.addAiCoachMessage({
        conversationId,
        isUser: true,
        message
      });
      
      // Get user context
      const user = await storage.getUser(conversation.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
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
  apiRouter.get("/api/interview/processes", async (req: Request, res: Response) => {
    try {
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const processes = await storage.getInterviewProcesses(user.id);
      res.status(200).json(processes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching interview processes" });
    }
  });
  
  apiRouter.post("/api/interview/processes", async (req: Request, res: Response) => {
    try {
      const processData = insertInterviewProcessSchema.parse(req.body);
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  
  apiRouter.get("/api/interview/processes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const processId = parseInt(id);
      
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getInterviewProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      res.status(200).json(process);
    } catch (error) {
      res.status(500).json({ message: "Error fetching interview process" });
    }
  });
  
  apiRouter.put("/api/interview/processes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const processId = parseInt(id);
      
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getInterviewProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      const updatedProcess = await storage.updateInterviewProcess(processId, req.body);
      res.status(200).json(updatedProcess);
    } catch (error) {
      res.status(500).json({ message: "Error updating interview process" });
    }
  });
  
  apiRouter.delete("/api/interview/processes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const processId = parseInt(id);
      
      if (isNaN(processId)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getInterviewProcess(processId);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      await storage.deleteInterviewProcess(processId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting interview process" });
    }
  });
  
  // Interview Stage Routes
  apiRouter.get("/api/interview/processes/:processId/stages", async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      const stages = await storage.getInterviewStages(processIdNum);
      res.status(200).json(stages);
    } catch (error) {
      res.status(500).json({ message: "Error fetching interview stages" });
    }
  });
  
  apiRouter.post("/api/interview/processes/:processId/stages", async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
      }
      
      const stageData = insertInterviewStageSchema.parse(req.body);
      const stage = await storage.createInterviewStage(processIdNum, stageData);
      res.status(201).json(stage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interview stage data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating interview stage" });
    }
  });
  
  apiRouter.put("/api/interview/stages/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stageId = parseInt(id);
      
      if (isNaN(stageId)) {
        return res.status(400).json({ message: "Invalid stage ID" });
      }
      
      const stage = await storage.getInterviewStage(stageId);
      
      if (!stage) {
        return res.status(404).json({ message: "Interview stage not found" });
      }
      
      const updatedStage = await storage.updateInterviewStage(stageId, req.body);
      res.status(200).json(updatedStage);
    } catch (error) {
      res.status(500).json({ message: "Error updating interview stage" });
    }
  });
  
  apiRouter.delete("/api/interview/stages/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const stageId = parseInt(id);
      
      if (isNaN(stageId)) {
        return res.status(400).json({ message: "Invalid stage ID" });
      }
      
      const stage = await storage.getInterviewStage(stageId);
      
      if (!stage) {
        return res.status(404).json({ message: "Interview stage not found" });
      }
      
      await storage.deleteInterviewStage(stageId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting interview stage" });
    }
  });
  
  // Followup Action Routes
  apiRouter.get("/api/interview/processes/:processId/followups", async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      const { stageId } = req.query;
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
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
  
  apiRouter.post("/api/interview/processes/:processId/followups", async (req: Request, res: Response) => {
    try {
      const { processId } = req.params;
      const processIdNum = parseInt(processId);
      
      if (isNaN(processIdNum)) {
        return res.status(400).json({ message: "Invalid process ID" });
      }
      
      const process = await storage.getInterviewProcess(processIdNum);
      
      if (!process) {
        return res.status(404).json({ message: "Interview process not found" });
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
  
  apiRouter.put("/api/interview/followup-actions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actionId = parseInt(id);
      
      if (isNaN(actionId)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      
      const action = await storage.getFollowupAction(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Followup action not found" });
      }
      
      const updatedAction = await storage.updateFollowupAction(actionId, req.body);
      res.status(200).json(updatedAction);
    } catch (error) {
      res.status(500).json({ message: "Error updating followup action" });
    }
  });
  
  apiRouter.put("/api/interview/followup-actions/:id/complete", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actionId = parseInt(id);
      
      if (isNaN(actionId)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      
      const action = await storage.getFollowupAction(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Followup action not found" });
      }
      
      const completedAction = await storage.completeFollowupAction(actionId);
      res.status(200).json(completedAction);
    } catch (error) {
      res.status(500).json({ message: "Error completing followup action" });
    }
  });
  
  apiRouter.delete("/api/interview/followup-actions/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const actionId = parseInt(id);
      
      if (isNaN(actionId)) {
        return res.status(400).json({ message: "Invalid action ID" });
      }
      
      const action = await storage.getFollowupAction(actionId);
      
      if (!action) {
        return res.status(404).json({ message: "Followup action not found" });
      }
      
      await storage.deleteFollowupAction(actionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting followup action" });
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

  apiRouter.post("/payments/create-subscription", async (req: Request, res: Response) => {
    try {
      // Get the authenticated user (for demo we're using alex)
      // In a real app with auth, you'd get the user from the session
      const userId = req.body.userId;
      let user;
      
      if (userId) {
        user = await storage.getUser(userId);
      } else {
        // Fallback to the sample user if no userId is provided
        user = await storage.getUserByUsername("alex");
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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

  apiRouter.get("/payments/payment-methods", async (req: Request, res: Response) => {
    try {
      // Get userId from query parameters
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      let user;
      
      if (userId) {
        user = await storage.getUser(userId);
      } else {
        // Fallback to the sample user if no userId is provided
        user = await storage.getUserByUsername("alex");
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const paymentMethods = await getUserPaymentMethods(user.id);
      res.status(200).json(paymentMethods);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  apiRouter.post("/payments/create-setup-intent", async (req: Request, res: Response) => {
    try {
      const userId = req.body.userId;
      let user;
      
      if (userId) {
        user = await storage.getUser(userId);
      } else {
        // Fallback to the sample user if no userId is provided
        user = await storage.getUserByUsername("alex");
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const setupIntent = await createSetupIntent(user.id);
      res.status(200).json(setupIntent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
  
  apiRouter.post("/payments/cancel-subscription", async (req: Request, res: Response) => {
    try {
      // We'll use the same approach as the /users/me endpoint
      // For consistency in this demo, get the user from the session
      const userId = req.body.userId;
      let user;
      
      if (userId) {
        user = await storage.getUser(userId);
      } else {
        // Fallback to the sample user if no userId is provided
        user = await storage.getUserByUsername("alex");
      }
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const result = await cancelSubscription(user.id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Email verification routes
  apiRouter.post("/auth/send-verification-email", async (req: Request, res: Response) => {
    try {
      // In a real app, get userId from session
      const user = await storage.getUserByUsername("alex");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
  apiRouter.post("/auth/send-email-change-verification", async (req: Request, res: Response) => {
    try {
      const { email, currentPassword } = req.body;
      
      // Validate the new email
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
      }
      
      // In a real app, get userId from session and validate password
      const user = await storage.getUserByUsername("alex");
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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
  apiRouter.post("/auth/change-password", async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }
      
      // For demo purposes, use the sample user
      const user = await storage.getUserByUsername("alex");
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
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

  app.use(apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
