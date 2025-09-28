/**
 * Script to fix university admin user assignments
 * This script helps assign university_id to university admin users who don't have one
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api.js'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL)

async function fixUniversityAdminAssignments() {
  try {
    console.log('🔍 Finding university admin users without university_id...')

    // Get all users
    const users = await convex.query(api.users.getAllUsers, {})

    // Find university admin users without university_id
    const adminUsersWithoutUniversity = users.filter(user =>
      user.role === 'university_admin' && !user.university_id
    )

    console.log(`Found ${adminUsersWithoutUniversity.length} university admin users without university_id`)

    if (adminUsersWithoutUniversity.length === 0) {
      console.log('✅ All university admin users have university_id assigned')
      return
    }

    // Get all universities
    const universities = await convex.query(api.universities.getAllUniversities, {})

    console.log(`Found ${universities.length} universities`)

    for (const user of adminUsersWithoutUniversity) {
      console.log(`\n👤 Processing user: ${user.email} (${user.name})`)

      // Try to find a university where admin_email matches user's email
      const matchingUniversity = universities.find(uni => uni.admin_email === user.email)

      if (matchingUniversity) {
        console.log(`  ✅ Found matching university: ${matchingUniversity.name} (${matchingUniversity.slug})`)

        // Update user's university_id
        await convex.mutation(api.users.updateUser, {
          clerkId: user.clerkId,
          updates: { university_id: matchingUniversity._id }
        })

        console.log(`  ✅ Assigned university_id to user`)
      } else {
        console.log(`  ⚠️  No matching university found for ${user.email}`)
        console.log(`     Available universities:`)
        universities.forEach(uni => {
          console.log(`       - ${uni.name} (${uni.slug}) - Admin: ${uni.admin_email || 'None'}`)
        })
      }
    }

    console.log('\n🎉 University admin assignment fix completed!')

  } catch (error) {
    console.error('❌ Error fixing university admin assignments:', error)
  }
}

// Run the script
fixUniversityAdminAssignments()
