import express from "express"
import { registerRoutes } from "../src/backend/routes.js"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: false, limit: "50mb" }))
app.use(cors())

// Register all your routes
await registerRoutes(app)

export default app
