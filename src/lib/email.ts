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
  const subject = 'Welcome to Ascentul - Activate Your Account'

  const text = `Hello ${name},

An account has been created for you on Ascentul, your career growth partner.

To get started, please activate your account using the following information:

Email: ${email}
Temporary Password: ${tempPassword}

Click here to activate your account and set your password:
${activationUrl}

This activation link will expire in 7 days.

Once activated, you'll have access to:
• AI-powered resume and cover letter tools
• Career path guidance
• Job application tracking
• And much more!

If you have any questions, please contact our support team.

Best regards,
The Ascentul Team`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul" style="max-width: 180px;">
      </div>

      <h1 style="color: #0C29AB; font-size: 26px; margin-bottom: 20px;">Welcome to Ascentul!</h1>

      <p>Hello ${name},</p>

      <p>An account has been created for you on <strong>Ascentul</strong>, your career growth partner.</p>

      <div style="background-color: #f0f2ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #0C29AB; font-size: 18px;">Your Account Details</h3>
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Email:</td>
            <td style="padding: 8px 0;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Temporary Password:</td>
            <td style="padding: 8px 0; font-family: monospace; background: white; padding: 4px 8px; border-radius: 3px;">${tempPassword}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${activationUrl}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;">
          Activate Your Account
        </a>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 25px;">
        <strong>Note:</strong> This activation link will expire in <strong>7 days</strong>.
        After activation, you'll be prompted to create a new password.
      </p>

      <div style="background-color: #f9fafb; padding: 20px; margin: 25px 0; border-radius: 6px;">
        <h3 style="margin-top: 0; font-size: 16px; color: #333;">What you'll have access to:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">AI-powered resume and cover letter optimization</li>
          <li style="margin: 8px 0;">Personalized career path guidance</li>
          <li style="margin: 8px 0;">Job application tracking and management</li>
          <li style="margin: 8px 0;">Interview preparation resources</li>
          <li style="margin: 8px 0;">Networking tools and recommendations</li>
        </ul>
      </div>

      <p>If you have any questions or need assistance, don't hesitate to reach out to our support team at
         <a href="mailto:support@ascentul.io" style="color: #0C29AB; text-decoration: none;">support@ascentul.io</a>
      </p>

      <p>We're excited to help you achieve your career goals!</p>

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
