/**
 * Test Nudge System
 *
 * Helper script to test nudge generation for a specific user
 *
 * Usage:
 *   npx ts-node scripts/test-nudge-system.ts [userId]
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL environment variable not set')
  process.exit(1)
}

const client = new ConvexHttpClient(CONVEX_URL)

async function testNudgeSystem(userId?: string) {
  console.log('🧪 Testing Nudge System\n')

  try {
    if (!userId) {
      console.log('⚠️  No userId provided. Please provide a userId as argument.')
      console.log('   Usage: npx ts-node scripts/test-nudge-system.ts <userId>')
      console.log()
      console.log('   To find a userId, check your Convex dashboard or query the users table.')
      process.exit(1)
    }

    // 1. Check user preferences
    console.log('1. Checking user preferences...')
    const prefs = await client.query(api.nudges.preferences.getUserPreferences, {
      userId,
    })
    console.log(`   Agent Enabled: ${prefs.agent_enabled ? '✅' : '❌'}`)
    console.log(`   Proactive Enabled: ${prefs.proactive_enabled ? '✅' : '❌'}`)
    console.log(`   Quiet Hours: ${prefs.quiet_hours_start}:00 - ${prefs.quiet_hours_end}:00`)
    console.log(`   Channels: ${Object.entries(prefs.channels).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}`)
    console.log()

    // 2. Evaluate nudges for user
    console.log('2. Evaluating nudge rules...')
    const evaluation = await client.query(api.nudges.scoring.evaluateNudgesForUser, {
      userId,
    })
    console.log(`   Total Rules Evaluated: ${evaluation.totalEvaluated}`)
    console.log(`   Rules Triggered: ${evaluation.triggered}`)
    console.log(`   Nudges Returned: ${evaluation.returned}`)
    console.log(`   Daily Count: ${evaluation.dailyCount} / ${evaluation.dailyLimit}`)
    console.log()

    if (evaluation.nudges && evaluation.nudges.length > 0) {
      console.log('3. Triggered Nudges:')
      console.log('━'.repeat(60))
      for (const nudge of evaluation.nudges) {
        console.log(`   📌 ${nudge.ruleType}`)
        console.log(`      Score: ${nudge.score}`)
        console.log(`      Reason: ${nudge.reason}`)
        if (nudge.suggestedAction) {
          console.log(`      Action: ${nudge.suggestedAction}`)
        }
        if (nudge.actionUrl) {
          console.log(`      URL: ${nudge.actionUrl}`)
        }
        console.log()
      }
      console.log('━'.repeat(60))
    } else {
      console.log('3. No nudges triggered for this user')
      console.log(`   Reason: ${evaluation.reason || 'No rules matched criteria'}`)
      console.log()
      console.log('   💡 Tips for testing:')
      console.log('      - Create applications >2 weeks old (appRescue)')
      console.log('      - Schedule interviews in next 24-48 hours (interviewSoon)')
      console.log('      - Create goals with 0% progress >30 days old (goalStalled)')
      console.log('      - Leave profile fields empty (profileIncomplete)')
      console.log()
    }

    // 4. Check existing nudges
    console.log('4. Checking existing nudges...')
    const stats = await client.query(api.nudges.scoring.getNudgeStats, {
      userId,
    })
    console.log(`   Today: ${stats.today.count} nudges (${stats.today.remaining} remaining)`)
    console.log(`   This Week: ${stats.week.count} nudges (${stats.week.accepted} accepted)`)
    console.log(`   Total: ${stats.all.total} nudges`)
    console.log(`   Acceptance Rate: ${stats.acceptanceRate}%`)
    console.log()

    // 5. Test individual rules
    console.log('5. Testing individual rules:')
    const rulesToTest = ['interviewSoon', 'appRescue', 'profileIncomplete', 'dailyCheck']

    for (const ruleType of rulesToTest) {
      try {
        const ruleEval = await client.query(api.nudges.scoring.evaluateSingleRule, {
          userId,
          ruleType,
        })
        const status = ruleEval.evaluation.shouldTrigger
          ? (ruleEval.onCooldown ? '⏰ Cooldown' : '✅ Would Trigger')
          : '❌ No Match'
        console.log(`   ${ruleType}: ${status}`)
      } catch (error) {
        console.log(`   ${ruleType}: ⚠️  Error evaluating`)
      }
    }
    console.log()

    console.log('✅ Test complete!')
    console.log()
    console.log('📝 Next steps:')
    console.log('   - View admin dashboard at /admin/nudges')
    console.log('   - Check user preferences at /account/agent-preferences')
    console.log('   - Monitor metrics and adjust rules as needed')
    console.log()

  } catch (error) {
    console.error('❌ Error testing nudge system:', error)
    process.exit(1)
  }
}

// Get userId from command line args
const userId = process.argv[2]

// Run the test
testNudgeSystem(userId)
  .then(() => {
    console.log('🎉 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
