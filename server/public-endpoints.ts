import { Router } from "express";
import { userReviews } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";

// Create a router specifically for public endpoints that don't require auth
const publicRouter = Router();

// GET /api/public/reviews - Public endpoint to get approved reviews
publicRouter.get("/reviews", async (req, res) => {
  try {
    console.log("Fetching public reviews...");
    
    // Get only approved public reviews
    const reviews = await db.select()
      .from(userReviews)
      .where(eq(userReviews.isPublic, true))
      .orderBy(desc(userReviews.createdAt))
      .limit(10);
    
    console.log(`Found ${reviews.length} public reviews`);
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching public reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

export default publicRouter;