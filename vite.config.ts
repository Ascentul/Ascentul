import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import themePlugin from "@replit/vite-plugin-shadcn-theme-json"
import path, { dirname } from "path"
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
export default defineConfig(async ({ mode }) => {
  // Load environment variables based on mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      themePlugin(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer()
            )
          ]
        : [])
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src", "frontend"),
        "@shared": path.resolve(__dirname, "src", "utils"),
        "@assets": path.resolve(__dirname, "src", "assets")
      }
    },
    root: __dirname,
    publicDir: path.resolve(__dirname, "src", "frontend", "assets"),
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, "src", "frontend", "index.html")
      },
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true
    },
    // Define environment variables to be accessible in the client code
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.SUPABASE_URL
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.SUPABASE_ANON_KEY
      ),
      "import.meta.env.DEV": mode === "development"
    }
  }
})
