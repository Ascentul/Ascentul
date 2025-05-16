import { Router } from "express";
import { userReviews, users } from "../utils/schema";
import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import cors from "cors";

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

// GET /api/public-reviews - WordPress-friendly reviews endpoint with CORS support
publicRouter.get("/public-reviews", cors({ origin: "*" }), async (req, res) => {
  try {
    console.log("WordPress reviews endpoint accessed");
    
    // Get approved and public reviews joined with user data
    const results = await db.select({
      review: userReviews,
      user: users
    })
    .from(userReviews)
    .leftJoin(users, eq(userReviews.userId, users.id))
    .where(
      and(
        eq(userReviews.isPublic, true),
        eq(userReviews.status, "approved")
      )
    )
    .orderBy(desc(userReviews.createdAt));
    
    // Format the response according to the WordPress site needs
    const formattedReviews = results.map(({ review, user }) => ({
      id: review.id,
      name: user?.name || "Verified User", // Fallback if no name
      rating: review.rating,
      body: review.feedback || "", // Safe fallback
      date: review.createdAt.toISOString()
    }));
    
    console.log(`Found ${formattedReviews.length} public approved reviews for WordPress`);
    
    // Set CORS headers explicitly (in addition to middleware)
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    res.status(200).json(formattedReviews);
  } catch (error) {
    console.error("Error fetching public reviews for WordPress:", error);
    res.status(500).json({ 
      error: "Failed to fetch reviews",
      message: "An error occurred while retrieving reviews"
    });
  }
});

export default publicRouter;