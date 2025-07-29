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

  console.log(`${formattedTime} [${source}] ${message}`)
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as true
  }

  // Use the vite config as-is, just add server options
  const config =
    typeof viteConfig === "function"
      ? await viteConfig({ mode: "development", command: "serve" })
      : viteConfig

  const vite = await createViteServer({
    ...config,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options)
        process.exit(1)
      }
    },
    server: serverOptions,
    appType: "custom"
  })

  app.use(vite.middlewares)

  // Only handle non-API routes with Vite - SPA fallback for client-side routing
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl

    // Skip API routes - let them be handled by the API router
    if (url.startsWith("/api/") || url.startsWith("/uploads/") || url.startsWith("/_next/")) {
      return next()
    }

    // Skip static assets (js, css, images, etc.)
    if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
      return next()
    }

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "frontend",
        "index.html"
      )

      // Check if the file exists
      if (!fs.existsSync(clientTemplate)) {
        console.error(`Template file not found: ${clientTemplate}`)
        return res.status(500).send('Template file not found')
      }

      // always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8")
      template = template.replace(
        `src="./main.tsx"`,
        `src="/main.tsx?v=${nanoid()}"`
      )
      
      // Transform and serve the HTML for all client-side routes
      const page = await vite.transformIndexHtml(url, template)
      res.status(200).set({ "Content-Type": "text/html" }).end(page)
    } catch (e) {
      console.error('Vite SPA routing error:', e)
      vite.ssrFixStacktrace(e as Error)
      next(e)
    }
  })
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "..", "dist", "public")

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    )
  }

  app.use(express.static(distPath))

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"))
  })
}
