import express, { Router } from "express";
import { storage } from "../storage";
import { insertUserReviewSchema } from "@shared/schema";
import { z } from "zod";

const router: Router = express.Router();

// Get all reviews for the current user
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const reviews = await storage.getUserReviews(userId);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Create a new review
router.post("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Validate the request body
    const validationResult = insertUserReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Invalid review data",
        details: validationResult.error.format() 
      });
    }
    
    const review = await storage.createUserReview(userId, validationResult.data);
    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating user review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;