import { Router } from "express";
import { db } from "../db";
import { userReviews, users } from "@shared/schema";
import { eq, and, desc, sql, like, asc } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin, requireAuth, publicAccess } from "../utils/validateRequest";

const router = Router();

// Schema for filtering reviews
const filterReviewsSchema = z.object({
  rating: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
});

// GET /api/reviews - Get all reviews (for admin dashboard)
router.get("/", requireAdmin, async (req, res) => {
  try {
    // The requireAdmin middleware already checks that the user is authenticated
    // and has admin or super_admin role, so we don't need to check again
    console.log("Admin review route accessed by user:", req.user?.id, "Role:", req.user?.role);

    // Parse query parameters for filtering and sorting
    const { rating, status, search, sortBy = "createdAt", sortOrder = "desc" } = filterReviewsSchema.parse(req.query);

    // Build query with filters
    let query = db.select({
      review: userReviews,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(userReviews)
    .leftJoin(users, eq(userReviews.userId, users.id));

    // Apply filters
    if (rating) {
      query = query.where(eq(userReviews.rating, parseInt(rating)));
    }

    if (status) {
      query = query.where(eq(userReviews.status, status));
    }

    if (search) {
      query = query.where(
        sql`${userReviews.feedback} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`} OR ${users.name} ILIKE ${`%${search}%`}`
      );
    }

    // Apply sorting
    if (sortBy && sortOrder) {
      if (sortBy === "rating") {
        query = sortOrder === "asc" 
          ? query.orderBy(asc(userReviews.rating)) 
          : query.orderBy(desc(userReviews.rating));
      } else if (sortBy === "createdAt") {
        query = sortOrder === "asc" 
          ? query.orderBy(asc(userReviews.createdAt)) 
          : query.orderBy(desc(userReviews.createdAt));
      }
    }

    const reviews = await query;

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

// GET /api/reviews/:id - Get a single review
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    // The requireAdmin middleware already checks authentication and role

    const { id } = req.params;
    
    // Check if id is a valid number to prevent NaN errors
    const reviewId = Number(id);
    if (isNaN(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const [review] = await db.select()
      .from(userReviews)
      .where(eq(userReviews.id, reviewId));

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ message: "Failed to fetch review" });
  }
});

// Schema for updating review status
const updateReviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  adminNotes: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// PATCH /api/reviews/:id - Update review status (for moderation)
router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    // Validate request body
    const validatedData = updateReviewStatusSchema.parse(req.body);
    
    // The requireAdmin middleware already checks authentication and role

    const { id } = req.params;
    const { status, adminNotes, isPublic } = validatedData;
    
    // Check if id is a valid number to prevent NaN errors
    const reviewId = Number(id);
    if (isNaN(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    // The requireAdmin middleware guarantees req.user exists
    const updateData: any = {
      moderatedAt: new Date(),
      moderatedBy: req.user!.id, // Add ! to tell TypeScript that req.user is not null
    };
    
    // Only include status if provided
    if (status !== undefined) {
      updateData.status = status;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }

    const [updatedReview] = await db.update(userReviews)
      .set(updateData)
      .where(eq(userReviews.id, reviewId))
      .returning();

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
});

// DELETE /api/reviews/:id - Delete a review
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    // The requireAdmin middleware already checks authentication and role

    const { id } = req.params;
    
    // Check if id is a valid number to prevent NaN errors
    const reviewId = Number(id);
    if (isNaN(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const [deletedReview] = await db.delete(userReviews)
      .where(eq(userReviews.id, reviewId))
      .returning();

    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review successfully deleted", review: deletedReview });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

// POST /api/reviews/flag/:id - Flag a review
router.post("/flag/:id", requireAdmin, async (req, res) => {
  try {
    // The requireAdmin middleware already checks authentication and role

    const { id } = req.params;
    const { adminNotes } = req.body;
    
    // Check if id is a valid number to prevent NaN errors
    const reviewId = Number(id);
    if (isNaN(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const [flaggedReview] = await db.update(userReviews)
      .set({
        status: "rejected",
        adminNotes: adminNotes || "Flagged by admin",
        isPublic: false,
        moderatedAt: new Date(),
        moderatedBy: req.user!.id, // Add ! to tell TypeScript that req.user is not null
      })
      .where(eq(userReviews.id, reviewId))
      .returning();

    if (!flaggedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review successfully flagged", review: flaggedReview });
  } catch (error) {
    console.error("Error flagging review:", error);
    res.status(500).json({ message: "Failed to flag review" });
  }
});

// GET /api/reviews/public - Public endpoint to get approved reviews
// This endpoint is intentionally not auth protected for testing purposes
router.get("/public", publicAccess, async (req, res) => {
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

// IMPORTANT: This catch-all route must be registered AFTER /public to avoid conflicts
// The ordering matters - more specific routes should come first

export default router;