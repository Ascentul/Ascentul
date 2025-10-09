#!/usr/bin/env npx tsx

/**
 * Send a single test email to verify domain configuration
 * Usage: npx tsx scripts/test-single-email.ts
 */

require('dotenv').config({ path: '.env.local' })

import { sendEmail } from '../src/lib/email'

const TEST_EMAIL = 'andrewvirts@gmail.com'

async function sendTestEmail() {
  console.log('📧 Sending test email to verify domain configuration...\n')

  try {
    const result = await sendEmail({
      to: TEST_EMAIL,
      subject: 'Ascentul - Domain Configuration Test',
      text: `This is a test email from Ascentul.

Domain: mail.ascentful.io
From: no-reply@mail.ascentful.io

If you're receiving this email, the email service is properly configured with the correct domain.

Best regards,
The Ascentul Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentul" style="max-width: 100%; height: auto;">
          </div>

          <h2 style="color: #0C29AB;">Domain Configuration Test</h2>

          <p>This is a test email from Ascentul to confirm the email service is properly configured.</p>

          <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #0C29AB;">Configuration Details</h3>
            <p><strong>Domain:</strong> mail.ascentful.io</p>
            <p><strong>From:</strong> no-reply@mail.ascentful.io</p>
            <p><strong>Service:</strong> Mailgun</p>
          </div>

          <p>If you're receiving this email, everything is working correctly!</p>

          <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Sent on ${new Date().toLocaleString()}<br>
            Message ID will be shown in the console
          </p>
        </div>
      `
    })

    console.log('✅ Test email sent successfully!')
    console.log(`📬 Sent to: ${TEST_EMAIL}`)
    console.log(`🆔 Message ID: ${result.id}`)
    console.log(`📨 Domain: mail.ascentful.io`)
    console.log(`✉️  From: no-reply@mail.ascentful.io`)
    console.log('\nPlease check your inbox to verify delivery.')

  } catch (error) {
    console.error('❌ Failed to send test email:', error)
  }
}

sendTestEmail().catch(console.error)