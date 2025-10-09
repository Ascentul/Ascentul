/**
 * Email service for Ascentul
 * Supports both Mailgun and SendGrid
 */

import formData from 'form-data'
import Mailgun from 'mailgun.js'

const DEFAULT_DOMAIN = 'mail.ascentful.io'
const DEFAULT_FROM = 'Ascentul <no-reply@mail.ascentful.io>'

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
  const mailgunKey = process.env.MAILGUN_SENDING_API_KEY || process.env.MAILGUN_API_KEY
  if (!mailgunKey) {
    throw new Error('MAILGUN_API_KEY is not configured')
  }

  const mailgun = new Mailgun(formData)
  const mg = mailgun.client({
    username: 'api',
    key: mailgunKey,
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
    if (process.env.MAILGUN_SENDING_API_KEY || process.env.MAILGUN_API_KEY) {
      return await sendWithMailgun(options)
    } else if (process.env.SENDGRID_API_KEY) {
      return await sendWithSendGrid(options)
    } else {
      throw new Error('No email service configured. Set MAILGUN_SENDING_API_KEY or SENDGRID_API_KEY')
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
  const subject = 'Welcome to Ascentul - Activate Your Account'

  const text = `Hi ${firstName},

Your Ascentul account has been created by your university administrator.

To activate your account and set your password, please click the link below:

${activationUrl}

Your login email: ${email}

This activation link will expire in 24 hours for security. Once activated, you can:
• Set your own secure password
• Access all career development tools
• Build your professional profile

After activation, log in at https://app.ascentul.io

If you did not expect this email or have questions, please contact your university administrator or our support team.

Welcome to Ascentul - we're excited to support your career journey!

Best,
The Ascentul Team`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6;">

      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentul" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <h1 style="color: #0C29AB; font-size: 28px; margin: 0;">Welcome to Ascentul!</h1>
      </div>

      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>

      <p style="font-size: 16px; margin-bottom: 24px;">Your Ascentul account has been created by your university administrator. To get started, please activate your account and set your password.</p>

      <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;"><strong>Your login email:</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #0C29AB; font-weight: 600;">${email}</p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${activationUrl}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 2px 4px rgba(12, 41, 171, 0.2);">
          Activate Account & Set Password
        </a>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 6px;">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #374151;">What happens next:</p>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
          <li style="margin-bottom: 8px;">Click the activation button above</li>
          <li style="margin-bottom: 8px;">Create your own secure password</li>
          <li style="margin-bottom: 8px;">Complete your profile setup</li>
          <li>Start using all career development tools</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px; padding: 12px; background-color: #fef3c7; border-radius: 4px; border-left: 3px solid #f59e0b;">
        ⏰ <strong>Important:</strong> This activation link expires in 24 hours. Please activate your account soon.
      </p>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        After activation, you can log in anytime at <a href="https://app.ascentul.io" style="color: #0C29AB; text-decoration: none; font-weight: 600;">https://app.ascentul.io</a>
      </p>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        If you did not expect this email or have questions, please contact your university administrator or our support team at <a href="mailto:support@ascentul.io" style="color: #0C29AB; text-decoration: none;">support@ascentul.io</a>
      </p>

      <p style="font-size: 16px; margin-top: 32px; margin-bottom: 8px;">
        Welcome to Ascentul. We're excited to support your career journey!
      </p>

      <p style="font-size: 16px; margin-top: 24px;">
        Best,<br>
        <strong>The Ascentul Team</strong>
      </p>

      <div style="margin-top: 50px; padding-top: 25px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
        <p style="margin-top: 10px;">
          <a href="https://ascentul.io/privacy" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Privacy Policy</a> |
          <a href="https://ascentul.io/terms" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Terms of Service</a> |
          <a href="mailto:support@ascentul.io" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Support</a>
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
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentul" style="max-width: 100%; height: auto;">
      </div>

      <h1 style="color: #0C29AB; font-size: 26px; margin-bottom: 20px;">You're Invited!</h1>

      <p>Hello,</p>

      <p>Great news! <strong>${universityName}</strong> has invited you to join <strong>Ascentul</strong>, a comprehensive career development platform designed to help you succeed in your professional journey.</p>

      <div style="background-color: #f0f2ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; color: #0C29AB;">Your Access Details</h3>
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

      <p>Best regards,<br><strong>The Ascentul Team</strong></p>

      <div style="margin-top: 50px; padding-top: 25px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
        <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
        <p style="margin-top: 10px;">
          <a href="https://ascentul.io/privacy" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Privacy Policy</a> |
          <a href="https://ascentul.io/terms" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Terms of Service</a> |
          <a href="mailto:support@ascentul.io" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Support</a>
        </p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  }).catch((error) => {
    // Handle email service not configured gracefully
    const errorMessage = error.message
    if (errorMessage.includes('No email service configured') ||
        errorMessage.includes('MAILGUN_SENDING_API_KEY') ||
        errorMessage.includes('SENDGRID_API_KEY')) {
      console.warn("Email service not configured - university invitation email not sent")
      return {
        id: `email_not_configured_${Date.now()}`,
        message: "Email service not configured",
        status: 200, // Return success to not break the flow
      }
    }
    // Re-throw other errors
    throw error
  })
}

/**
 * Send support ticket response email to user
 */
export async function sendSupportTicketResponseEmail(
  email: string,
  name: string,
  ticketSubject: string,
  responseMessage: string,
  ticketUrl: string
): Promise<EmailResult> {
  const firstName = name.split(' ')[0]
  const subject = `Re: ${ticketSubject}`

  const text = `Hi ${firstName},

You have received a new response to your support ticket: "${ticketSubject}"

Response:
${responseMessage}

You can view the full conversation and reply at:
${ticketUrl}

If you have any further questions, please respond through the support portal.

Best regards,
The Ascentul Support Team`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentul" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <h1 style="color: #0C29AB; font-size: 24px; margin: 0;">Support Ticket Update</h1>
      </div>

      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>

      <p style="font-size: 16px; margin-bottom: 24px;">You have received a new response to your support ticket:</p>

      <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Ticket:</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #0C29AB; font-weight: 600;">${ticketSubject}</p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 6px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Response:</p>
        <p style="margin: 0; font-size: 15px; color: #374151; white-space: pre-wrap;">${responseMessage}</p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${ticketUrl}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 2px 4px rgba(12, 41, 171, 0.2);">
          View Full Conversation
        </a>
      </div>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        If you have any further questions, please respond through the support portal.
      </p>

      <p style="font-size: 16px; margin-top: 32px;">
        Best regards,<br>
        <strong>The Ascentul Support Team</strong>
      </p>

      <div style="margin-top: 50px; padding-top: 25px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
        <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
        <p style="margin-top: 10px;">
          <a href="https://ascentul.io/privacy" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Privacy Policy</a> |
          <a href="https://ascentul.io/terms" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Terms of Service</a> |
          <a href="mailto:support@ascentul.io" style="color: #6b7280; text-decoration: none; margin: 0 12px;">Support</a>
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
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentul" style="max-width: 100%; height: auto;">
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
