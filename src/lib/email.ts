/**
 * Email service for Ascentul
 * Supports both Mailgun and SendGrid
 */

import formData from 'form-data'
import Mailgun from 'mailgun.js'

const DEFAULT_DOMAIN = 'mail.ascentul.io'
const DEFAULT_FROM = 'Ascentul <no-reply@mail.ascentul.io>'

export interface EmailOptions {
  to: string | string[]
  from?: string
  subject: string
  text: string
  html?: string
  domain?: string
}

interface EmailResult {
  id: string
  message: string
  status: number
}

/**
 * Send email using Mailgun
 */
async function sendWithMailgun(options: EmailOptions): Promise<EmailResult> {
  if (!process.env.MAILGUN_API_KEY) {
    throw new Error('MAILGUN_API_KEY is not configured')
  }

  const mailgun = new Mailgun(formData)
  const mg = mailgun.client({
    username: 'api',
    key: process.env.MAILGUN_API_KEY,
  })

  const emailData: any = {
    from: options.from || DEFAULT_FROM,
    to: Array.isArray(options.to) ? options.to.join(',') : options.to,
    subject: options.subject,
    text: options.text,
  }

  if (options.html) {
    emailData.html = options.html
  }

  const result = await mg.messages.create(options.domain || DEFAULT_DOMAIN, emailData)

  return {
    id: result.id || `msg_${Date.now()}`,
    message: result.message || 'Email sent',
    status: 200,
  }
}

/**
 * Send email using SendGrid (fallback)
 */
async function sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not configured')
  }

  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)

  const msg = {
    to: options.to,
    from: options.from || DEFAULT_FROM,
    subject: options.subject,
    text: options.text,
    html: options.html,
  }

  const [response] = await sgMail.send(msg)

  return {
    id: response.headers['x-message-id'] || `msg_${Date.now()}`,
    message: 'Email sent',
    status: response.statusCode,
  }
}

/**
 * Send email - automatically chooses provider based on env vars
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Validate required params
  if (!options.to || !options.subject || !options.text) {
    throw new Error('Missing required email parameters: to, subject, and text')
  }

  try {
    // Try Mailgun first, fallback to SendGrid
    if (process.env.MAILGUN_API_KEY) {
      return await sendWithMailgun(options)
    } else if (process.env.SENDGRID_API_KEY) {
      return await sendWithSendGrid(options)
    } else {
      throw new Error('No email service configured. Set MAILGUN_API_KEY or SENDGRID_API_KEY')
    }
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

/**
 * Send account activation email to a new user created by admin
 */
export async function sendActivationEmail(
  email: string,
  name: string,
  tempPassword: string,
  activationUrl: string
): Promise<EmailResult> {
  const firstName = name.split(' ')[0]
  const subject = 'Welcome to Ascentful - Set Your Password'

  const text = `Hi ${firstName},

Your Ascentful account has been created. To get started, please set your password using the secure link below:

Set Your Password

This link will expire in 24 hours for your security. Once your password is set, you can log in anytime at https://app.ascentful.io.

If you did not expect this email, please ignore it or contact our support team.

Welcome to Ascentful. We're excited to support your journey and help you get the most out of your account.

Best,
The Ascentful Team`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6;">

      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>

      <p style="font-size: 16px; margin-bottom: 24px;">Your Ascentful account has been created. To get started, please set your password using the secure link below:</p>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${activationUrl}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;">
          Set Your Password
        </a>
      </div>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        This link will expire in 24 hours for your security. Once your password is set, you can log in anytime at <a href="https://app.ascentful.io" style="color: #0C29AB; text-decoration: none;">https://app.ascentful.io</a>.
      </p>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        If you did not expect this email, please ignore it or contact our support team.
      </p>

      <p style="font-size: 16px; margin-top: 32px; margin-bottom: 8px;">
        Welcome to Ascentful. We're excited to support your journey and help you get the most out of your account.
      </p>

      <p style="font-size: 16px; margin-top: 24px;">
        Best,<br>
        <strong>The Ascentful Team</strong>
      </p>

      <div style="margin-top: 50px; padding-top: 25px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        <p>© ${new Date().getFullYear()} Ascentful, Inc. All rights reserved.</p>
        <p style="margin-top: 10px;">
          <a href="https://ascentful.io/privacy" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Privacy Policy</a> |
          <a href="https://ascentful.io/terms" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Terms of Service</a> |
          <a href="mailto:support@ascentful.io" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Support</a>
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  })
}

/**
 * Send university invitation email to students
 */
export async function sendUniversityInvitationEmail(
  email: string,
  universityName: string
): Promise<EmailResult> {
  const signUpUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-up?email=${encodeURIComponent(email)}`

  const subject = `You're Invited to Join ${universityName} on Ascentul`

  const text = `Hello,

You've been invited to join ${universityName} on Ascentul - your career development platform.

Your university has provided you with access to Ascentul's comprehensive career tools and resources at no cost.

To get started, please create your account using this email address: ${email}

Click here to sign up:
${signUpUrl}

Once you create your account, you'll have access to:
• AI-powered resume and cover letter builder
• Career path guidance and goal setting
• Job application tracking
• Interview preparation resources
• Professional networking tools
• And much more!

If you have any questions, please contact your university's career services or reach out to our support team.

Best regards,
The Ascentul Team`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul" style="max-width: 180px;">
      </div>

      <h1 style="color: #0C29AB; font-size: 26px; margin-bottom: 20px;">You're Invited!</h1>

      <p>Hello,</p>

      <p>Great news! <strong>${universityName}</strong> has invited you to join <strong>Ascentul</strong>, a comprehensive career development platform designed to help you succeed in your professional journey.</p>

      <div style="background-color: #f0f2ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #0C29AB; font-size: 18px;">Your Access Details</h3>
        <p style="margin: 8px 0;">Use this email address to sign up: <strong>${email}</strong></p>
        <p style="margin: 8px 0; font-size: 14px; color: #666;">Your university has provided you with complimentary access to all premium features.</p>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${signUpUrl}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;">
          Create Your Account
        </a>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; margin: 25px 0; border-radius: 6px;">
        <h3 style="margin-top: 0; font-size: 16px; color: #333;">What you'll have access to:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">AI-powered resume and cover letter builder</li>
          <li style="margin: 8px 0;">Personalized career path guidance and goal setting</li>
          <li style="margin: 8px 0;">Job application tracking and management</li>
          <li style="margin: 8px 0;">Interview preparation resources and tips</li>
          <li style="margin: 8px 0;">Professional networking tools</li>
          <li style="margin: 8px 0;">Career coaching and mentorship</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 25px;">
        If you have any questions about this invitation, please contact your university's career services department or reach out to our support team at
        <a href="mailto:support@ascentul.io" style="color: #0C29AB; text-decoration: none;">support@ascentul.io</a>
      </p>

      <p>We're excited to support your career development journey!</p>

      <p style="margin-top: 30px;">Best regards,<br><strong>The Ascentul Team</strong></p>

      <div style="margin-top: 50px; padding-top: 25px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
        <p style="margin-top: 10px;">
          <a href="https://ascentul.io/privacy" style="color: #0C29AB; text-decoration: none; margin: 0 12px;">Privacy Policy</a> |
          <a href="https://ascentul.io/terms" style="color: #0C29AB; text-decoration: none; margin: 0 12px;">Terms of Service</a> |
          <a href="mailto:support@ascentul.io" style="color: #0C29AB; text-decoration: none; margin: 0 12px;">Support</a>
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  })
}

/**
 * Send welcome email to existing self-registered users
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  const subject = '🎉 Welcome to Ascentul - Your Career Growth Partner'

  const text = `Hello ${name},

Welcome to Ascentul! We're excited to have you join our platform.

Here at Ascentul, we're dedicated to helping you achieve your career goals through personalized guidance, powerful tools, and cutting-edge AI assistance.

To get started:
1. Complete your professional profile
2. Set your first career goal
3. Explore our AI tools to optimize your resume and cover letter

If you have any questions or need assistance, don't hesitate to reach out to our support team.

Best regards,
The Ascentul Team`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul" style="max-width: 150px;">
      </div>

      <h1 style="color: #0C29AB; font-size: 24px; margin-bottom: 20px;">Welcome to Ascentul!</h1>

      <p>Hello ${name},</p>

      <p>We're <strong>thrilled</strong> to have you join the Ascentul community! Our mission is to empower your career growth with intelligent tools and resources.</p>

      <div style="background-color: #f0f2ff; border-left: 4px solid #0C29AB; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0C29AB;">Getting Started Is Easy</h3>
        <ul style="padding-left: 20px;">
          <li>Complete your professional profile</li>
          <li>Set your first career goal</li>
          <li>Explore our AI tools to optimize your resume and cover letter</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://app.ascentul.io/dashboard"
           style="background-color: #0C29AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Go to Dashboard
        </a>
      </div>

      <p>We're excited to be part of your professional journey and help you reach new heights in your career.</p>

      <p>Best regards,<br>The Ascentul Team</p>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
        <p>
          <a href="https://ascentul.io/privacy" style="color: #0C29AB; text-decoration: none; margin: 0 10px;">Privacy Policy</a> |
          <a href="https://ascentul.io/terms" style="color: #0C29AB; text-decoration: none; margin: 0 10px;">Terms of Service</a> |
          <a href="mailto:support@ascentul.io" style="color: #0C29AB; text-decoration: none; margin: 0 10px;">Support</a>
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  })
}
