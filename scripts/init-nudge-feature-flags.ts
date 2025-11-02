/**
 * Initialize Nudge System Feature Flags
 *
 * Run this script to create the necessary feature flags for the nudge system
 *
 * Usage:
 *   npx ts-node scripts/init-nudge-feature-flags.ts
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL environment variable not set')
  process.exit(1)
}

const client = new ConvexHttpClient(CONVEX_URL)

async function initializeFeatureFlags() {
  console.log('🚀 Initializing nudge system feature flags...\n')

  try {
    // 1. Create 'agent' feature flag
    console.log('1. Creating "agent" feature flag...')
    await client.mutation(api.config.featureFlags.setFeatureFlag, {
      flagKey: 'agent',
      enabled: true,
      allowedPlans: ['free', 'premium', 'university'],
      rolloutPercentage: 100, // Start at 100% for all users
      whitelistedUserIds: [],
    })
    console.log('   ✅ Agent feature flag created\n')

    // 2. Create 'proactive_nudges' feature flag
    console.log('2. Creating "proactive_nudges" feature flag...')
    await client.mutation(api.config.featureFlags.setFeatureFlag, {
      flagKey: 'proactive_nudges',
      enabled: true,
      allowedPlans: ['free', 'premium', 'university'],
      rolloutPercentage: 0, // Start at 0% for gradual rollout
      whitelistedUserIds: [],
    })
    console.log('   ✅ Proactive nudges feature flag created (disabled for rollout)\n')

    // 3. Verify flags were created
    console.log('3. Verifying feature flags...')
    const agentFlag = await client.query(api.config.featureFlags.getFeatureFlag, {
      flagKey: 'agent',
    })
    const proactiveFlag = await client.query(api.config.featureFlags.getFeatureFlag, {
      flagKey: 'proactive_nudges',
    })

    console.log('\n📊 Feature Flag Status:')
    console.log('━'.repeat(60))
    console.log(`Agent Feature:`)
    console.log(`  Enabled: ${agentFlag?.enabled ? '✅' : '❌'}`)
    console.log(`  Rollout: ${agentFlag?.rollout_percentage}%`)
    console.log(`  Plans: ${agentFlag?.allowed_plans.join(', ')}`)
    console.log()
    console.log(`Proactive Nudges Feature:`)
    console.log(`  Enabled: ${proactiveFlag?.enabled ? '✅' : '❌'}`)
    console.log(`  Rollout: ${proactiveFlag?.rollout_percentage}%`)
    console.log(`  Plans: ${proactiveFlag?.allowed_plans.join(', ')}`)
    console.log('━'.repeat(60))

    console.log('\n✅ Feature flags initialized successfully!\n')
    console.log('📝 Next Steps:')
    console.log('   1. Test the system with internal users')
    console.log('   2. Gradually increase rollout percentage')
    console.log('   3. Monitor metrics at /admin/nudges')
    console.log('   4. See docs/NUDGE_SYSTEM_ROLLOUT.md for full rollout plan')
    console.log()
  } catch (error) {
    console.error('❌ Error initializing feature flags:', error)
    process.exit(1)
  }
}

// Run the initialization
initializeFeatureFlags()
  .then(() => {
    console.log('🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
