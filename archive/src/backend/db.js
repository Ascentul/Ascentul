import { supabase, supabaseAdmin } from "./supabase";
// Export Supabase clients for database operations
export { supabase, supabaseAdmin };
// Legacy exports for backward compatibility (can be removed later)
export const pool = null;
export const db = null;
// Database health check function
export async function checkDatabaseConnection() {
    try {
        // Test Supabase connection with a simple query
        const { data, error } = await supabase
            .from("users")
            .select("count")
            .limit(1);
        if (error) {
            console.error("Supabase connection test failed:", error);
            return false;
        }

        return true;
    }
    catch (error) {
        console.error("Database connection test failed:", error);
        return false;
    }
}
