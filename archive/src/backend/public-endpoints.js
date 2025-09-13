import { Router } from "express";
import { supabaseHelpers } from "./supabase";
import cors from "cors";
// Create a router specifically for public endpoints that don't require auth
const publicRouter = Router();
// GET /api/public/reviews - Public endpoint to get approved reviews
publicRouter.get("/reviews", async (req, res) => {
    try {

        const reviews = await supabaseHelpers.query("reviews", q => q.eq("is_public", true)
            .order("created_at", { ascending: false })
            .limit(10));

        res.status(200).json({ reviews });
    }
    catch (error) {
        console.error("Error fetching public reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
});
// GET /api/public-reviews - WordPress-friendly reviews endpoint with CORS support
publicRouter.get("/public-reviews", cors({ origin: "*" }), async (req, res) => {
    try {

        const results = await supabaseHelpers.query("reviews", q => q.select("*, users(*)")
            .eq("is_public", true)
            .eq("status", "approved")
            .order("created_at", { ascending: false }));
        const formattedReviews = results.map(row => ({
            id: row.id,
            name: row.users?.name || "Verified User",
            rating: row.rating,
            body: row.feedback || "",
            date: row.created_at
        }));

        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.status(200).json(formattedReviews);
    }
    catch (error) {
        console.error("Error fetching public reviews for WordPress:", error);
        res.status(500).json({
            error: "Failed to fetch reviews",
            message: "An error occurred while retrieving reviews"
        });
    }
});
export default publicRouter;
