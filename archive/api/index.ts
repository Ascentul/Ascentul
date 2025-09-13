import { VercelRequest, VercelResponse } from "@vercel/node"
import express from "express"
import { registerRoutes } from "../src/backend/routes"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: false, limit: "50mb" }))
app.use(cors())

// Register all your routes
registerRoutes(app)

export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any)
}
