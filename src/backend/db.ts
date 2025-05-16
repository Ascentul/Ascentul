import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../utils/schema";
import { supabase, supabaseAdmin } from './supabase';
import { ENV, validateEnv } from '../config/env';

// For backward compatibility, maintain the Neon DB connection if DATABASE_URL is provided
let pool: Pool | undefined;
let db: ReturnType<typeof drizzle> | undefined;

if (ENV.DATABASE_URL) {
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: ENV.DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log('Connected to Neon database');
} else {
  // Validate that Supabase environment variables are set
  const isValid = validateEnv();
  
  if (!isValid) {
    throw new Error(
      "Supabase connection details (SUPABASE_URL, SUPABASE_ANON_KEY) must be set."
    );
  }
  
  console.log('Using Supabase for database operations');
  // Note: In this configuration, we'll use the supabase client directly
  // instead of drizzle, so we don't initialize db here
}

// This ensures backward compatibility with existing code
export { pool, db, supabase, supabaseAdmin };

// Check database connection
export async function checkDatabaseConnection() {
  try {
    if (ENV.DATABASE_URL && db) {
      // For Neon DB connection
      const result = await pool!.query('SELECT NOW()');
      console.log('Neon DB connection successful:', result.rows[0]);
      return true;
    } else {
      // For Supabase connection
      const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact' });
      
      if (error) throw error;
      
      console.log('Supabase connection successful');
      return true;
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
