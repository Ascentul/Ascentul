import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import publicRouter from "./public-endpoints";
import path from "path";
import cors from "cors";
import { ENV, validateEnv } from "../config/env";
import { checkDatabaseConnection } from "./db";
import dotenv from "dotenv";
import { verifySupabaseToken } from "./supabase-auth";
import { checkStorageHealth } from "./storage";
import { supabaseHelpers } from "./supabase";
// Load .env file if it exists
dotenv.config();
// Log all environment variables for debugging (masking sensitive values)

// Validate environment variables
validateEnv();
// No longer need session type declarations with Supabase auth
export const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Mount the public router BEFORE auth middleware
// This ensures public endpoints don't require authentication
app.use("/api/public", publicRouter);

// New WordPress-friendly reviews endpoint with CORS enabled
// Health check endpoint (public, no auth)
app.get("/api/health", async (_req, res) => {
    try {
        const health = await checkStorageHealth();
        const statusCode = health.status === "healthy" ? 200 : 503;
        res.status(statusCode).json(health);
    }
    catch (error) {
        res.status(500).json({ message: "Health check failed" });
    }
});
// Apply Supabase auth middleware to all /api routes (except public ones above)
// Auth middleware for protected API endpoints under /api
app.use("/api", (req, res, next) => {
    const path = req.path;
    // Skip auth for health and public routes
    if (path === "/health" ||
        path.startsWith("/public") ||
        path === "/public-reviews" ||
        path.startsWith("/career-paths")) {
        return next();
    }
    return verifySupabaseToken(req, res, next);
});
// Expose public WordPress-friendly reviews endpoint directly
app.get("/api/public-reviews", cors({ origin: "*" }), async (req, res) => {
    try {
        const results = await supabaseHelpers.query("reviews", q => q.select("*, users(*)").eq("is_public", true).eq("status", "approved").order("created_at", { ascending: false }));
        const formatted = results.map(row => ({
            id: row.id,
            name: row.users?.name || "Verified User",
            rating: row.rating,
            body: row.feedback || "",
            date: row.created_at
        }));
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.status(200).json(formatted);
    }
    catch (error) {
        console.error("Error fetching WordPress reviews:", error);
        res.status(500).json({ error: "Failed to fetch reviews", message: "Error retrieving reviews" });
    }
});
// Apply Supabase auth middleware to all other /api routes
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            log(logLine);
        }
    });
    next();
});
(async () => {
    // Check database connection before starting server
    const isConnected = await checkDatabaseConnection();
    if (!isConnected && ENV.NODE_ENV === "production") {
        console.error("❌ Database connection failed - server cannot start in production mode");
        process.exit(1);
    }
    else if (!isConnected) {

    }
    else {

    }
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        throw err;
    });
    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
        await setupVite(app, server);
    }
    else {
        serveStatic(app);
    }
    // Force port 3000 for consistent development experience
    const PORT = 3000; // Always use port 3000
    const HOST = "0.0.0.0"; // Always bind to all network interfaces for Replit

    try {
        server
            .listen({
            port: PORT,
            host: HOST
        }, () => {
            const serverUrl = `http://${HOST}:${PORT}`;

            log(`✅ Server running at ${serverUrl}`);
            // On Replit, show the public URL
            if (process.env.REPL_SLUG && process.env.REPL_OWNER) {

            }
            else {
                log(`🌐 You can access the app at http://localhost:${PORT}`);
            }
            // Output info about available routes to help with debugging

            // Check if frontend dev server is correctly set up

        })
            .on("error", (err) => {
            console.error("❌ SERVER ERROR:", err.message);
            if (err.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use. Try stopping other servers.`);
                console.error("❌ PORT conflict detected. Exiting.");
                // For Replit compatibility, we need a clean server restart
                process.exit(1); // Force exit to restart the process
            }
            process.exit(1); // Force exit on error
        });
    }
    catch (err) {
        console.error("❌ CRITICAL SERVER ERROR:", err.message);
        process.exit(1); // Force exit on error
    }
})();
