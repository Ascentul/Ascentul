import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createRegularUserAccount() {
  console.log('🔧 Creating regular user test account...')
  
  const testUser = {
    email: 'testuser@ascentul.io',
    password: 'TestUser123!',
    name: 'Test User',
    username: 'testuser',
    role: 'user',
    subscription_plan: 'free',
    subscription_status: 'active'
  }

  try {
    // 1. Create user in Supabase Auth
    console.log(`📧 Creating auth user: ${testUser.email}`)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        name: testUser.name
      }
    })

    if (authError) {
      console.error('❌ Auth creation error:', authError)
      return
    }

    console.log('✅ Auth user created:', authData.user.id)

    // 2. Create user record in database
    console.log('📝 Creating user database record...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testUser.email,
        name: testUser.name,
        username: testUser.username,
        role: testUser.role,
        subscription_plan: testUser.subscription_plan,
        subscription_status: testUser.subscription_status,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('❌ Database user creation error:', userError)
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log('✅ Database user created successfully')

    // 3. Create some sample career data for testing
    console.log('📊 Creating sample career data...')
    
    // Create a sample goal
    const { error: goalError } = await supabase
      .from('goals')
      .insert({
        user_id: authData.user.id,
        title: 'Land a Software Engineer role at a tech company',
        description: 'Find a full-stack software engineer position at a growing tech company with good work-life balance',
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        status: 'active',
        priority: 'high'
      })

    if (goalError) {
      console.warn('⚠️ Could not create sample goal:', goalError)
    } else {
      console.log('✅ Sample goal created')
    }

    // Create a sample application
    const { error: appError } = await supabase
      .from('applications')
      .insert({
        user_id: authData.user.id,
        company_name: 'TechCorp Inc.',
        position_title: 'Software Engineer',
        application_date: new Date().toISOString(),
        status: 'applied',
        job_url: 'https://example.com/jobs/software-engineer',
        notes: 'Applied through company website. Looks like a great opportunity!'
      })

    if (appError) {
      console.warn('⚠️ Could not create sample application:', appError)
    } else {
      console.log('✅ Sample application created')
    }

    // Create a sample contact
    const { error: contactError } = await supabase
      .from('contacts')
      .insert({
        user_id: authData.user.id,
        full_name: 'Sarah Johnson',
        email: 'sarah.johnson@techcorp.com',
        company: 'TechCorp Inc.',
        position: 'Senior Engineering Manager',
        relationship: 'recruiter',
        notes: 'Met at tech meetup. Very friendly and helpful.'
      })

    if (contactError) {
      console.warn('⚠️ Could not create sample contact:', contactError)
    } else {
      console.log('✅ Sample contact created')
    }

    console.log('\n🎉 Regular user test account created successfully!')
    console.log('📧 Email:', testUser.email)
    console.log('🔑 Password:', testUser.password)
    console.log('👤 Name:', testUser.name)
    console.log('🔑 Username:', testUser.username)
    console.log('👤 Role:', testUser.role)
    console.log('💳 Plan:', testUser.subscription_plan)
    console.log('🆔 User ID:', authData.user.id)
    console.log('\n📝 Sample data created:')
    console.log('- 1 career goal')
    console.log('- 1 job application')
    console.log('- 1 professional contact')
    console.log('\nYou can now test the career dashboard features with this account!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
createRegularUserAccount()
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })