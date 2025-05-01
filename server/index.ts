import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import { sessionStore } from "./session-store";
import path from "path";

// Log all environment variables for debugging (masking sensitive values)
console.log('Environment Variables Status:');
console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'present' : 'missing');
console.log('- PGDATABASE:', process.env.PGDATABASE ? 'present' : 'missing');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'present' : 'missing');

// Declare session values on the Express Request type
declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Extend the Express Request type
declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData>;
    }
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configure session middleware
app.use(session({
  secret: "career-dev-platform-secret", // In production, use environment variable
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    secure: process.env.NODE_ENV === "production", // Only secure in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
  } else {
    serveStatic(app);
  }

  // For Replit, we need to detect the correct port
  // Replit sets various environment variables we can use
  const PORT = process.env.PORT || 8080; // Use port 8080 as an alternative
  const HOST = "0.0.0.0"; // Always bind to all network interfaces for Replit
  
  console.log(`✨ Attempting to start server on ${HOST}:${PORT}...`);
  console.log(`✨ Environment: NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  console.log(`✨ REPL_ID=${process.env.REPL_ID || 'not set'}, REPL_SLUG=${process.env.REPL_SLUG || 'not set'}`);
  
  try {
    server.listen({
      port: PORT,
      host: HOST,
    }, () => {
      const serverUrl = `http://${HOST}:${PORT}`;
      console.log(`✅ SERVER STARTED SUCCESSFULLY: ${serverUrl}`);
      log(`✅ Server running at ${serverUrl}`);
      
      // On Replit, show the public URL
      if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        console.log(`🔗 Public URL: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
      } else {
        log(`🌐 You can access the app at http://localhost:${PORT}`);
      }
      
      // Output info about available routes to help with debugging
      console.log("\n📡 API ROUTES AVAILABLE:");
      console.log("- /api                    (API info)");
      console.log("- /api/health             (Server health check)");
      console.log("- /api/career-data        (Career profile data)");
      console.log("- /api/cover-letters      (Cover letter management)");
      console.log("- /api/resumes            (Resume management)");
      console.log("- /api/jobs               (Job listings)");
      
      // Check if frontend dev server is correctly set up
      console.log("\n🔍 Server configuration:");
      console.log(`- Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`- Using Vite dev server: ${app.get("env") === "development" ? "Yes" : "No"}`);
      console.log(`- Static files path: ${app.get("env") !== "development" ? path.resolve(__dirname, "public") : "Using Vite"}`);
    }).on('error', (err: NodeJS.ErrnoException) => {
      console.error('❌ SERVER ERROR:', err.message);
      
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try stopping other servers.`);
        console.error('❌ PORT conflict detected. Exiting.'); 
        // For Replit compatibility, we need a clean server restart
        process.exit(1); // Force exit to restart the process
      }
      
      process.exit(1); // Force exit on error
    });
  } catch (err) {
    console.error('❌ CRITICAL SERVER ERROR:', (err as Error).message);
    process.exit(1); // Force exit on error
  }
})();