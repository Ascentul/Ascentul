import express, { type Request, Response, NextFunction } from "express"
import { registerRoutes } from "./routes"
import { setupVite, serveStatic, log } from "./vite"
import publicRouter from "./public-endpoints"
import path from "path"
import cors from "cors"
import { ENV, validateEnv } from "../config/env"
import { checkDatabaseConnection } from "./db"
import dotenv from "dotenv"
import { verifySupabaseToken } from "./supabase-auth"

// Load .env file if it exists
dotenv.config()

// Log all environment variables for debugging (masking sensitive values)
console.log("Environment Variables Status:")
console.log(
  "- OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "present" : "missing"
)
console.log("- SUPABASE_URL:", ENV.SUPABASE_URL ? "present" : "missing")
console.log(
  "- SUPABASE_ANON_KEY:",
  ENV.SUPABASE_ANON_KEY ? "present" : "missing"
)

// Validate environment variables
validateEnv()

// No longer need session type declarations with Supabase auth

const app = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: false, limit: "50mb" }))

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

// Mount the public router BEFORE auth middleware
// This ensures public endpoints don't require authentication
app.use("/api/public", publicRouter)
console.log("Public API routes mounted at /api/public")

// New WordPress-friendly reviews endpoint with CORS enabled
app.use("/api/public-reviews", cors({ origin: "*" }))

// Comment out Supabase auth middleware so we can apply it in routes.ts
// app.use("/api", verifySupabaseToken)

app.use((req, res, next) => {
  const start = Date.now()
  const path = req.path
  let capturedJsonResponse: Record<string, any> | undefined = undefined

  const originalResJson = res.json
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson
    return originalResJson.apply(res, [bodyJson, ...args])
  }

  res.on("finish", () => {
    const duration = Date.now() - start
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…"
      }

      log(logLine)
    }
  })

  next()
})
;(async () => {
  // Check database connection before starting server
  const isConnected = await checkDatabaseConnection()
  if (!isConnected && ENV.NODE_ENV === "production") {
    console.error(
      "❌ Database connection failed - server cannot start in production mode"
    )
    process.exit(1)
  } else if (!isConnected) {
    console.warn(
      "⚠️ Database connection failed but continuing in development mode"
    )
    console.warn(
      "⚠️ Some functionality will not work without a database connection"
    )
  } else {
    console.log("✅ Database connection successful")
  }

  const server = await registerRoutes(app)

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500
    const message = err.message || "Internal Server Error"

    res.status(status).json({ message })
    throw err
  })

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server)
  } else {
    serveStatic(app)
  }

  // For Replit, we need to detect the correct port
  // Replit sets various environment variables we can use
  const PORT = ENV.PORT || 3000 // Use port 3000 as default for Replit compatibility
  const HOST = "0.0.0.0" // Always bind to all network interfaces for Replit

  console.log(`✨ Attempting to start server on ${HOST}:${PORT}...`)
  console.log(`✨ Environment: NODE_ENV=${ENV.NODE_ENV}`)
  console.log(
    `✨ REPL_ID=${process.env.REPL_ID || "not set"}, REPL_SLUG=${
      process.env.REPL_SLUG || "not set"
    }`
  )

  try {
    server
      .listen(
        {
          port: PORT,
          host: HOST
        },
        () => {
          const serverUrl = `http://${HOST}:${PORT}`
          console.log(`✅ SERVER STARTED SUCCESSFULLY: ${serverUrl}`)
          log(`✅ Server running at ${serverUrl}`)

          // On Replit, show the public URL
          if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
            console.log(
              `🔗 Public URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
            )
          } else {
            log(`🌐 You can access the app at http://localhost:${PORT}`)
          }

          // Output info about available routes to help with debugging
          console.log("\n📡 API ROUTES AVAILABLE:")
          console.log("- /api                    (API info)")
          console.log("- /api/health             (Server health check)")
          console.log("- /api/career-data        (Career profile data)")
          console.log("- /api/cover-letters      (Cover letter management)")
          console.log("- /api/resumes            (Resume management)")
          console.log("- /api/jobs               (Job listings)")

          // Check if frontend dev server is correctly set up
          console.log("\n🔍 Server configuration:")
          console.log(`- Environment: ${ENV.NODE_ENV}`)
          console.log(
            `- Using Vite dev server: ${
              app.get("env") === "development" ? "Yes" : "No"
            }`
          )
          console.log(
            `- Static files path: ${
              app.get("env") !== "development"
                ? path.resolve(__dirname, "public")
                : "Using Vite"
            }`
          )
        }
      )
      .on("error", (err: NodeJS.ErrnoException) => {
        console.error("❌ SERVER ERROR:", err.message)

        if (err.code === "EADDRINUSE") {
          console.error(
            `Port ${PORT} is already in use. Try stopping other servers.`
          )
          console.error("❌ PORT conflict detected. Exiting.")
          // For Replit compatibility, we need a clean server restart
          process.exit(1) // Force exit to restart the process
        }

        process.exit(1) // Force exit on error
      })
  } catch (err) {
    console.error("❌ CRITICAL SERVER ERROR:", (err as Error).message)
    process.exit(1) // Force exit on error
  }
})()
