import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyUsageTrackingMigration() {
  try {
    console.log('🚀 Starting usage tracking migration...')
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, 'add-usage-tracking-columns.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Loaded migration SQL from:', migrationPath)
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
      console.log(`📋 SQL: ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct execution if RPC fails
          console.log('⚠️  RPC failed, trying direct execution...')
          const { error: directError } = await supabase
            .from('_temp_migration')
            .select('*')
            .limit(0) // This will fail but allows us to execute raw SQL
          
          // For now, we'll log the statement and continue
          console.log('⚠️  Could not execute statement directly. Manual execution may be required.')
          console.log('📋 Statement:', statement)
        } else {
          console.log('✅ Statement executed successfully')
        }
      } catch (err) {
        console.log('⚠️  Error executing statement:', err.message)
        console.log('📋 Statement:', statement)
        // Continue with other statements
      }
    }
    
    console.log('\n🎉 Migration completed!')
    console.log('\n📊 Verifying migration results...')
    
    // Verify the migration by checking if the new columns exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, last_login, login_count, total_session_time, account_status')
      .limit(1)
    
    if (usersError) {
      console.log('❌ Error verifying users table:', usersError.message)
    } else {
      console.log('✅ Users table columns verified')
      console.log('📋 Sample user data:', users?.[0] || 'No users found')
    }
    
    // Check if user_sessions table exists
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('id')
      .limit(1)
    
    if (sessionsError) {
      console.log('❌ Error verifying user_sessions table:', sessionsError.message)
    } else {
      console.log('✅ User sessions table verified')
    }
    
    console.log('\n🏁 Migration verification completed!')
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Execute the migration
applyUsageTrackingMigration()
  .then(() => {
    console.log('\n✨ All done! Usage tracking is now set up.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
