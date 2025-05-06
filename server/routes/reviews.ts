import { Router } from "express";
import { db } from "../db";
import { userReviews, users } from "@shared/schema";
import { eq, and, desc, sql, like, asc } from "drizzle-orm";
import { z } from "zod";
import { validateRequest } from "../utils/validateRequest";

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
router.get("/", async (req, res) => {
  // Check if user is super admin
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
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
router.get("/:id", async (req, res) => {
  // Check if user is super admin
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
    const { id } = req.params;

    const [review] = await db.select()
      .from(userReviews)
      .where(eq(userReviews.id, parseInt(id)));

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
  status: z.enum(["pending", "approved", "rejected"]),
  adminNotes: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// PATCH /api/reviews/:id - Update review status (for moderation)
router.patch("/:id", validateRequest(updateReviewStatusSchema), async (req, res) => {
  // Check if user is super admin
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
    const { id } = req.params;
    const { status, adminNotes, isPublic } = req.body;

    const updateData: any = {
      status,
      moderatedAt: new Date(),
      moderatedBy: req.user.id,
    };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }

    const [updatedReview] = await db.update(userReviews)
      .set(updateData)
      .where(eq(userReviews.id, parseInt(id)))
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
router.delete("/:id", async (req, res) => {
  // Check if user is super admin
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
    const { id } = req.params;

    const [deletedReview] = await db.delete(userReviews)
      .where(eq(userReviews.id, parseInt(id)))
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
router.post("/flag/:id", async (req, res) => {
  // Check if user is super admin
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Unauthorized access" });
  }

  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const [flaggedReview] = await db.update(userReviews)
      .set({
        status: "rejected",
        adminNotes: adminNotes || "Flagged by admin",
        isPublic: false,
        moderatedAt: new Date(),
        moderatedBy: req.user.id,
      })
      .where(eq(userReviews.id, parseInt(id)))
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

export default router;