/**
 * Test script for Mailgun email functionality
 * Run: npx tsx scripts/test-email.ts <your-email@example.com>
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Manually load environment variables from .env.local
try {
  const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
} catch (error) {
  console.warn('⚠️  Could not load .env.local file')
}

import { sendEmail } from '../src/lib/email'

async function testEmail() {
  const recipientEmail = process.argv[2]

  if (!recipientEmail) {
    console.error('❌ Error: Please provide a recipient email address')
    console.log('Usage: npx tsx scripts/test-email.ts <your-email@example.com>')
    process.exit(1)
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(recipientEmail)) {
    console.error('❌ Error: Invalid email format')
    process.exit(1)
  }

  console.log('📧 Testing Mailgun email configuration...')
  console.log(`   Sending to: ${recipientEmail}`)
  console.log(`   Domain: mail.ascentul.io (testing old domain)`)
  console.log('')

  try {
    const result = await sendEmail({
      to: recipientEmail,
      subject: 'Ascentul Email Test',
      domain: 'mail.ascentul.io', // Using old domain for testing
      text: `Hello!

This is a test email from Ascentul to verify that the Mailgun integration is working correctly.

If you received this email, the email service is properly configured and operational.

Domain: mail.ascentul.io (testing old domain)
Timestamp: ${new Date().toISOString()}

Best regards,
The Ascentul Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0C29AB; font-size: 28px; margin: 0;">✅ Email Test Successful!</h1>
          </div>

          <p style="font-size: 16px;">Hello!</p>

          <p style="font-size: 16px;">This is a test email from <strong>Ascentul</strong> to verify that the Mailgun integration is working correctly.</p>

          <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>✓ Email Service Status:</strong> Operational</p>
            <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>✓ Sending Domain:</strong> mail.ascentul.io (testing old domain)</p>
            <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>✓ Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>

          <p style="font-size: 15px; color: #6b7280;">
            If you received this email, the email service is properly configured and operational.
          </p>

          <p style="font-size: 16px; margin-top: 32px;">
            Best regards,<br>
            <strong>The Ascentul Team</strong>
          </p>

          <div style="margin-top: 50px; padding-top: 25px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
            <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
          </div>
        </div>
      `
    })

    console.log('✅ Email sent successfully!')
    console.log(`   Message ID: ${result.id}`)
    console.log(`   Status: ${result.status}`)
    console.log('')
    console.log('💡 Check your inbox (and spam folder) for the test email.')
  } catch (error) {
    console.error('❌ Email send failed!')
    console.error('')

    if (error instanceof Error) {
      console.error('Error details:', error.message)

      if (error.message.includes('MAILGUN_SENDING_API_KEY')) {
        console.error('')
        console.error('💡 Fix: Set MAILGUN_SENDING_API_KEY in your .env.local file')
      } else if (error.message.includes('domain')) {
        console.error('')
        console.error('💡 Fix: Verify mail.ascentful.io domain in Mailgun dashboard')
      }
    } else {
      console.error('Error:', error)
    }

    process.exit(1)
  }
}

testEmail()
