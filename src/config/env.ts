import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Setup for __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables with defaults
export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Session Secret
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
  
  // Port for the server
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database URL (used by the existing code)
  DATABASE_URL: process.env.DATABASE_URL || '',
};

// Validate required env vars
export function validateEnv() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];
  
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please set these variables in your .env file or environment');
    return false;
  }
  
  return true;
} 