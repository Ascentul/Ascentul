import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

// Create PostgreSQL session store
const PgStore = connectPgSimple(session);

// Create a persistent PostgreSQL session store
// Falls back to memory store if database connection fails
let sessionStore: session.Store;

try {
  // Try to create a PostgreSQL session store
  sessionStore = new PgStore({
    pool,
    tableName: 'session', // Default is "session"
    createTableIfMissing: true, // Automatically create the session table
  });
  
  console.log("✅ Using PostgreSQL for session storage");
} catch (error) {
  // Fall back to memory store if PostgreSQL connection fails
  console.error("❌ Failed to create PostgreSQL session store:", error);
  console.log("⚠️ FALLING BACK to in-memory session store. Sessions will be lost on server restart!");
  
  const MemoryStore = createMemoryStore(session);
  sessionStore = new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });
}

export { sessionStore };