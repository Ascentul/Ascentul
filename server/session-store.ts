import session from "express-session";
import createMemoryStore from "memorystore";

// Create session store
const MemoryStore = createMemoryStore(session);
export const sessionStore = new MemoryStore({
  checkPeriod: 86400000, // prune expired entries every 24h
});