import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env';
import type { Database } from '../types/supabase';

// Create Supabase client
export const supabase = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Supabase admin client with service role for admin operations
export const supabaseAdmin = createClient<Database>(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Helper functions for common database operations
export const supabaseHelpers = {
  // Get a record by ID from a specific table
  async getById<T>(table: string, id: number | string): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching ${table} with ID ${id}:`, error);
      return null;
    }
    
    return data as T;
  },
  
  // Get records for a specific user from a table
  async getByUserId<T>(table: string, userId: number | string): Promise<T[]> {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error(`Error fetching ${table} for user ${userId}:`, error);
      return [];
    }
    
    return data as T[];
  },
  
  // Insert a new record into a table
  async insert<T>(table: string, record: Record<string, any>): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      return null;
    }
    
    return data as T;
  },
  
  // Update a record in a table
  async update<T>(table: string, id: number | string, updates: Record<string, any>): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating ${table} with ID ${id}:`, error);
      return null;
    }
    
    return data as T;
  },
  
  // Delete a record from a table
  async delete(table: string, id: number | string): Promise<boolean> {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting from ${table} with ID ${id}:`, error);
      return false;
    }
    
    return true;
  }
}; 