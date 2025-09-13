import { createClient } from "@supabase/supabase-js";
// Set URL and anon key from environment variables
// These are injected by Vite at build time using import.meta.env
// Using fallbacks to prevent build errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "missing-url";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "missing-key";
// Create a Supabase client for frontend usage
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // Persist session in localStorage
        autoRefreshToken: true,
        detectSessionInUrl: true // Enable for OAuth redirects
    }
});
export default supabaseClient;
