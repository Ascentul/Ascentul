import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// Import all backend modules directly to ensure they're bundled
import { fileURLToPath } from "url"
import { dirname, join } from "path"

dotenv.config()

const app = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: false, limit: "50mb" }))
app.use(cors())

// Since we can't import from ../src in Vercel, we'll inline the essential routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.get("/api/job-applications", (req, res) => {
  // For now, return empty array - this needs proper storage setup
  res.json([])
})

app.get("/api/users/me", (req, res) => {
  // For now, return a basic user object
  res.json({ id: "1", email: "user@example.com" })
})

app.get("/api/models", (req, res) => {
  res.json({ models: [] })
})

app.get("/api/contacts/all-followups", (req, res) => {
  res.json([])
})

// Handle all other API routes with a 404
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API route not found" })
})

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  )
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  )

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  // Get the API path
  const path = req.url.replace("/api", "") || "/"

  console.log(`API Request: ${req.method} ${path}`)

  try {
    // Route handling
    switch (path) {
      case "/health":
        return res.status(200).json({
          status: "ok",
          timestamp: new Date().toISOString(),
          method: req.method,
          path: path
        })

      case "/job-applications":
        return res.status(200).json([])

      case "/users/me":
        return res.status(200).json({
          id: "1",
          email: "user@example.com",
          name: "Demo User"
        })

      case "/models":
        return res.status(200).json({ models: [] })

      case "/contacts/all-followups":
        return res.status(200).json([])

      default:
        return res.status(404).json({
          error: "API route not found",
          path: path,
          method: req.method
        })
    }
  } catch (error) {
    console.error("API Error:", error)
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    })
  }
}
