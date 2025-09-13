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
import { checkStorageHealth } from "./storage"
import { supabaseHelpers } from "./supabase"

// Load .env file if it exists
dotenv.config()

// Log all environment variables for debugging (masking sensitive values)

;(async () => {
  // Check database connection before starting server
  const isConnected = await checkDatabaseConnection()
  if (!isConnected && ENV.NODE_ENV === "production") {
    console.error(
      "❌ Database connection failed - server cannot start in production mode"
    )
    process.exit(1)
  } else if (!isConnected) {

  } else {
