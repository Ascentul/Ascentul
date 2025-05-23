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

export default async (req, res) => {
  // Ensure the request path starts with /api
  if (!req.url.startsWith("/api")) {
    req.url = "/api" + req.url
  }

  return app(req, res)
}
