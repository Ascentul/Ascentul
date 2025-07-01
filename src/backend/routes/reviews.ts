import { Router } from "express";
import { db } from "../db";
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

// IMPORTANT: The order of these routes matter!
// Static routes (like /public) MUST be placed BEFORE parameterized routes (like /:id)
// or Express will interpret "public" as an ID parameter

// GET /api/reviews/public - Public endpoint to get approved reviews
// This endpoint is intentionally not auth protected for testing purposes
router.get("/public", publicAccess, async (req, res) => {
  try {
    console.log("Fetching public reviews...");
    
    // Get only approved public reviews (temporarily removed deletedAt check until column is created)
    const reviews = await db.select()
      .from(userReviews)
      .where(
        and(
          eq(userReviews.isPublic, true),
          eq(userReviews.status, "approved")
          // Temporary fix: removed deletedAt check until column is created
          // sql`${userReviews.deletedAt} IS NULL`
        )
      )
      .orderBy(sql`${userReviews.createdAt} DESC`)
      .limit(10);
    
    console.log(`Found ${reviews.length} public reviews`);
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching public reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
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
    // Temporary fix: removed deletedAt check until column is created
    // .where(sql`${userReviews.deletedAt} IS NULL`); // Exclude deleted reviews

    // Apply additional filters
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

    // For now, just use fixed sort order as a temporary workaround using SQL literals
    // This simplifies the code and avoids using problematic sort expressions
    const sortDirection = sortOrder === "asc" ? "ASC" : "DESC";
    const sortColumn = sortBy === "rating" ? userReviews.rating : userReviews.createdAt;
    query = query.orderBy(sql`${sortColumn} ${sortDirection}`);

    const reviews = await query;

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
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

// DELETE /api/reviews/:id - Soft delete a review
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    // The requireAdmin middleware already checks authentication and role

    const { id } = req.params;
    
    // Check if id is a valid number to prevent NaN errors
    const reviewId = Number(id);
    if (isNaN(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    // Temporary hard delete until deletedAt column is created
    // Instead of soft delete, just make it not visible by setting status to rejected
    // and isPublic to false
    const [deletedReview] = await db.update(userReviews)
      .set({
        status: "rejected",
        isPublic: false,
        moderatedAt: new Date(),
        moderatedBy: req.user!.id, // Add moderator info
        adminNotes: "Manually deleted by admin"
      })
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

// GET /api/reviews/:id - Get a single review
// This must be the LAST route to avoid conflicting with other routes
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

export default router;