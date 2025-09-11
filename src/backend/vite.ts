import express, { type Express } from "express"
import fs from "fs"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
import { createServer as createViteServer, createLogger } from "vite"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import { type Server } from "http"
import viteConfig from "../../vite.config.js"
import { nanoid } from "nanoid"

const viteLogger = createLogger()

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  })

}
