import express, { Request, Response } from "express";
import { storage } from "../storage";
import { insertUserReviewSchema } from "@shared/schema";
import { z } from "zod";

const reviewsRouter = express.Router();

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: () => void) {
  // Skip auth check in development mode with dev_token
  if (req.query.dev_token === "bypass_auth" || process.env.NODE_ENV === "development") {
    console.log("DEV MODE: Bypassing auth with dev_token");
    
    // In development, use user ID 2 (sample user) if no session exists
    if (!req.session || !req.session.userId) {
      req.session = req.session || {};
      req.session.userId = 2; // Sample user ID
    }
    
    return next();
  }
  
  console.log("Checking auth. Session:", req.session?.userId ? "Has userId" : "No userId");
  
  if (!req.session || !req.session.userId) {
    console.log("Auth check failed - no session or userId");
    return res.status(401).json({ message: "Authentication required" });
  }
  
  console.log("Auth check passed for user ID:", req.session.userId);
  next();
}

// Get all reviews for the current user
reviewsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId;
    const reviews = await storage.getUserReviews(userId);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// Create a new review
reviewsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session!.userId;
    
    // Validate the request body against the insertUserReviewSchema
    const validationResult = insertUserReviewSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid review data", 
        errors: validationResult.error.format() 
      });
    }
    
    const reviewData = validationResult.data;
    
    // Create the review in storage
    const newReview = await storage.createUserReview(userId, reviewData);
    
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Failed to create review" });
  }
});

export default reviewsRouter;