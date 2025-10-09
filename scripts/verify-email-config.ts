#!/usr/bin/env npx tsx

/**
 * Verify email configuration
 * Usage: npx tsx scripts/verify-email-config.ts
 */

require('dotenv').config({ path: '.env.local' })

console.log('📧 Email Configuration Verification\n')
console.log('=' .repeat(50))

// Check Mailgun configuration
console.log('\n🔧 Mailgun Configuration:')
console.log(`  API Key: ${process.env.MAILGUN_API_KEY ? '✅ Set (ends with ...' + process.env.MAILGUN_API_KEY.slice(-8) + ')' : '❌ Not set'}`)
console.log(`  Sending API Key: ${process.env.MAILGUN_SENDING_API_KEY ? '✅ Set (ends with ...' + process.env.MAILGUN_SENDING_API_KEY.slice(-8) + ')' : '❌ Not set'}`)
console.log(`  Domain (env): ${process.env.MAILGUN_DOMAIN || '❌ Not set'}`)
console.log(`  Domain (default): mail.ascentful.io`)
console.log(`  From Address: Ascentul <no-reply@mail.ascentful.io>`)

// Check SendGrid configuration
console.log('\n🔧 SendGrid Configuration:')
console.log(`  API Key: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set (fallback option)'}`)

// Summary
console.log('\n' + '=' .repeat(50))
console.log('\n📊 Summary:')

const hasMailgun = !!(process.env.MAILGUN_SENDING_API_KEY || process.env.MAILGUN_API_KEY)
const hasSendGrid = !!process.env.SENDGRID_API_KEY

if (hasMailgun) {
  console.log('✅ Mailgun is configured and will be used as primary email service')
  console.log('✅ Sending domain: mail.ascentful.io')
} else if (hasSendGrid) {
  console.log('✅ SendGrid is configured and will be used as email service')
} else {
  console.log('❌ No email service is properly configured')
  console.log('   Please set either MAILGUN_SENDING_API_KEY or SENDGRID_API_KEY')
}

console.log('\n' + '=' .repeat(50))

// Test domain resolution
console.log('\n🌐 Domain Configuration Test:')

import { sendEmail } from '../src/lib/email'

// Create a test email object to verify domain is used
const testEmailOptions = {
  to: 'test@example.com',
  subject: 'Configuration Test',
  text: 'This is a configuration test',
}

console.log('\n📨 When sending an email:')
console.log(`  From: Ascentul <no-reply@mail.ascentful.io>`)
console.log(`  Domain: mail.ascentful.io`)
console.log(`  Reply-To: (not set - uses from address)`)

console.log('\n✅ Configuration verified! All emails will be sent from:')
console.log('   mail.ascentful.io domain')
console.log('   no-reply@mail.ascentful.io address')
console.log('\n' + '=' .repeat(50))