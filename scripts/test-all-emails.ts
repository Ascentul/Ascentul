#!/usr/bin/env npx tsx

/**
 * Test all email templates with real sending
 * Usage: npx tsx scripts/test-all-emails.ts
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' })

import {
  sendEmail,
  sendActivationEmail,
  sendUniversityInvitationEmail,
  sendSupportTicketResponseEmail,
  sendWelcomeEmail,
} from '../src/lib/email'

const TEST_EMAIL = 'andrewvirts@gmail.com'
const TEST_NAME = 'Andrew Virts'
const TEST_UNIVERSITY = 'Test University'

async function testEmailService() {
  console.log('🚀 Starting email service test...\n')

  // Check configuration
  const hasMailgun = !!(process.env.MAILGUN_SENDING_API_KEY || process.env.MAILGUN_API_KEY)
  const hasSendGrid = !!process.env.SENDGRID_API_KEY

  if (!hasMailgun && !hasSendGrid) {
    console.error('❌ No email service configured!')
    console.log('Please set either MAILGUN_API_KEY or SENDGRID_API_KEY in .env.local')
    process.exit(1)
  }

  console.log(`✅ Email service configured: ${hasMailgun ? 'Mailgun' : 'SendGrid'}\n`)

  const results = []

  // Test 1: Basic test email
  console.log('📧 1. Testing basic email...')
  try {
    const result = await sendEmail({
      to: TEST_EMAIL,
      subject: 'Test Email - Basic Functionality',
      text: 'This is a test email from Ascentul to verify email service is working.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentul" style="max-width: 100%; height: auto;">
          </div>
          <h2 style="color: #0C29AB;">Test Email - Basic Functionality</h2>
          <p>This is a test email from Ascentul to verify email service is working.</p>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Sent on ${new Date().toLocaleString()}
          </p>
        </div>
      `
    })
    console.log(`✅ Basic email sent successfully! ID: ${result.id}`)
    results.push({ type: 'Basic Email', success: true, id: result.id })
  } catch (error) {
    console.error('❌ Failed to send basic email:', error)
    results.push({ type: 'Basic Email', success: false, error: error.message })
  }

  // Test 2: Activation Email
  console.log('\n📧 2. Testing activation email...')
  try {
    const tempPassword = 'TempPass123!'
    const activationToken = `act_${Date.now()}_test123`
    const activationUrl = `https://app.ascentul.io/activate/${activationToken}`

    const result = await sendActivationEmail(
      TEST_EMAIL,
      TEST_NAME,
      tempPassword,
      activationUrl
    )
    console.log(`✅ Activation email sent successfully! ID: ${result.id}`)
    console.log(`   Temp Password: ${tempPassword}`)
    console.log(`   Activation URL: ${activationUrl}`)
    results.push({ type: 'Activation Email', success: true, id: result.id })
  } catch (error) {
    console.error('❌ Failed to send activation email:', error)
    results.push({ type: 'Activation Email', success: false, error: error.message })
  }

  // Test 3: University Invitation Email
  console.log('\n📧 3. Testing university invitation email...')
  try {
    const result = await sendUniversityInvitationEmail(
      TEST_EMAIL,
      TEST_UNIVERSITY
    )
    console.log(`✅ University invitation email sent successfully! ID: ${result.id}`)
    console.log(`   University: ${TEST_UNIVERSITY}`)
    results.push({ type: 'University Invitation', success: true, id: result.id })
  } catch (error) {
    console.error('❌ Failed to send university invitation email:', error)
    results.push({ type: 'University Invitation', success: false, error: error.message })
  }

  // Test 4: Support Ticket Response Email
  console.log('\n📧 4. Testing support ticket response email...')
  try {
    const ticketId = 'ticket_' + Date.now()
    const ticketUrl = `https://app.ascentul.io/support/${ticketId}`

    const result = await sendSupportTicketResponseEmail(
      TEST_EMAIL,
      TEST_NAME,
      'Help with Resume Upload',
      'Thank you for contacting support. We have reviewed your issue and here is the solution: Please ensure your resume is in PDF format and under 5MB. You can upload it through the Resume section of your dashboard.',
      ticketUrl
    )
    console.log(`✅ Support ticket email sent successfully! ID: ${result.id}`)
    console.log(`   Ticket URL: ${ticketUrl}`)
    results.push({ type: 'Support Ticket Response', success: true, id: result.id })
  } catch (error) {
    console.error('❌ Failed to send support ticket email:', error)
    results.push({ type: 'Support Ticket Response', success: false, error: error.message })
  }

  // Test 5: Welcome Email
  console.log('\n📧 5. Testing welcome email...')
  try {
    const result = await sendWelcomeEmail(TEST_EMAIL, TEST_NAME)
    console.log(`✅ Welcome email sent successfully! ID: ${result.id}`)
    results.push({ type: 'Welcome Email', success: true, id: result.id })
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error)
    results.push({ type: 'Welcome Email', success: false, error: error.message })
  }

  // Test 6: Password Reset Email (requires Convex action)
  console.log('\n📧 6. Testing password reset email...')
  console.log('⚠️  Password reset email uses Convex action - testing template only')
  try {
    const resetToken = `reset_${Date.now()}_test456`
    const resetUrl = `https://app.ascentul.io/reset-password/${resetToken}`

    const result = await sendEmail({
      to: TEST_EMAIL,
      subject: 'Reset Your Ascentul Password',
      text: `Hello ${TEST_NAME},\n\nWe received a request to reset your password.\n\nClick here to reset: ${resetUrl}\n\nThis link expires in 1 hour.\n\nBest regards,\nThe Ascentul Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentul" style="max-width: 100%; height: auto;">
          </div>

          <h1 style="color: #0C29AB; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h1>

          <p>Hello ${TEST_NAME},</p>

          <p>We received a request to reset your password for your Ascentul account.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #0C29AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="font-size: 14px; color: #666;">
            This link will expire in <strong>1 hour</strong>.
          </p>

          <p style="font-size: 14px; color: #666;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>

          <p>Best regards,<br>The Ascentul Team</p>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
            <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
          </div>
        </div>
      `
    })
    console.log(`✅ Password reset email sent successfully! ID: ${result.id}`)
    console.log(`   Reset URL: ${resetUrl}`)
    results.push({ type: 'Password Reset', success: true, id: result.id })
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error)
    results.push({ type: 'Password Reset', success: false, error: error.message })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`\n✅ Successful: ${successful}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📧 Total: ${results.length}`)

  console.log('\nDetailed Results:')
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌'
    console.log(`${index + 1}. ${icon} ${result.type}`)
    if (result.success) {
      console.log(`   Message ID: ${result.id}`)
    } else {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log(`📬 All test emails have been sent to: ${TEST_EMAIL}`)
  console.log('Please check your inbox (and spam folder) to verify delivery.')
  console.log('='.repeat(60))
}

// Run the test
testEmailService().catch(console.error)