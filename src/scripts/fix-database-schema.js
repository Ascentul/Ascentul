const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixDatabaseSchema() {
  console.log('Checking and fixing users table schema...')
  
  try {
    // First, check if updated_at column exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'updated_at')
    
    if (columnError) {
      console.error('Error checking columns:', columnError)
      return
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ updated_at column already exists in users table')
    } else {
      console.log('❌ updated_at column missing, but cannot add via RPC')
      console.log('Please run this SQL manually in Supabase dashboard:')
      console.log(`
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
UPDATE users SET updated_at = created_at WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
      `)
    }
    
    // Test user creation to see current schema
    console.log('Testing user table structure...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('Error testing users table:', testError)
    } else {
      console.log('Current users table structure:', Object.keys(testData[0] || {}))
    }
    
  } catch (error) {
    console.error('Database schema check failed:', error)
  }
}

fixDatabaseSchema()
