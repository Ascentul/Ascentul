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

After activation, log in at https://app.ascentful.io

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
        After activation, you can log in anytime at <a href="https://app.ascentful.io" style="color: #0C29AB; text-decoration: none; font-weight: 600;">https://app.ascentful.io</a>
      </p>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        If you did not expect this email or have questions, please contact your university administrator or our support team at <a href="mailto:support@ascentful.io" style="color: #0C29AB; text-decoration: none;">support@ascentful.io</a>
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
 * Send university invitation email to students (Email Template #1)
 * University Admin invites student
 */
export async function sendUniversityInvitationEmail(
  email: string,
  universityName: string,
  inviteLink: string
): Promise<EmailResult> {
  const firstName = email.split('@')[0] // Extract first part of email as fallback name

  const subject = `You're Invited to Join ${universityName} on Ascentful 🎓`

  const text = `Hi ${firstName},

${universityName} has partnered with Ascentful, a comprehensive career development platform designed to help you plan your career, track your goals, and land your next opportunity.

You've been invited to join using this email: ${email}

Your university has provided you with complimentary access to all premium features.

Click here to activate your account:
${inviteLink}

What You'll Have Access To:
• AI-powered resume and cover letter builder
• Personalized career path guidance and goal tracking
• Job search, application tracking, and interview prep
• Smart networking tools to manage professional connections
• On-demand AI career coaching and progress insights

If you have any questions, please contact ${universityName}'s Career Services Department or reach out to our team at support@ascentful.io.

We're excited to support your career journey!

Warm regards,
The Ascentful Team
www.ascentful.io`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentful" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <h1 style="color: #0C29AB; font-size: 28px; margin: 0;">You're Invited!</h1>
      </div>

      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>

      <p style="font-size: 16px; margin-bottom: 24px;"><strong>${universityName}</strong> has partnered with <strong>Ascentful</strong>, a comprehensive career development platform designed to help you plan your career, track your goals, and land your next opportunity.</p>

      <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 15px;">You've been invited to join using this email:</p>
        <p style="margin: 0; font-size: 16px; color: #0C29AB; font-weight: 600;">${email}</p>
        <p style="margin: 12px 0 0 0; font-size: 14px; color: #6b7280;">Your university has provided you with <strong>complimentary access to all premium features</strong>.</p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${inviteLink}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 2px 4px rgba(12, 41, 171, 0.2);">
          Activate Your Account →
        </a>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 6px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">What You'll Have Access To</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280; line-height: 1.8;">
          <li style="margin-bottom: 8px;">AI-powered resume and cover letter builder</li>
          <li style="margin-bottom: 8px;">Personalized career path guidance and goal tracking</li>
          <li style="margin-bottom: 8px;">Job search, application tracking, and interview prep</li>
          <li style="margin-bottom: 8px;">Smart networking tools to manage professional connections</li>
          <li style="margin-bottom: 8px;">On-demand AI career coaching and progress insights</li>
        </ul>
      </div>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        If you have any questions, please contact <strong>${universityName}</strong>'s Career Services Department or reach out to our team at
        <a href="mailto:support@ascentful.io" style="color: #0C29AB; text-decoration: none; font-weight: 600;">support@ascentful.io</a>.
      </p>

      <p style="font-size: 16px; margin-top: 32px;">
        We're excited to support your career journey!
      </p>

      <p style="font-size: 16px; margin-top: 24px;">
        Warm regards,<br>
        <strong>The Ascentful Team</strong><br>
        <a href="https://www.ascentful.io" style="color: #0C29AB; text-decoration: none;">www.ascentful.io</a>
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
 * Send welcome email to self-registered individual consumers (Email Template #4)
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<EmailResult> {
  const firstName = name.split(' ')[0]
  const subject = 'Welcome to Ascentful - Let\'s Build Your Career OS 🚀'
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentful.io'}/dashboard`

  const text = `Hi ${firstName},

Welcome to Ascentful, the Career OS that helps you plan your path, track progress, and move confidently toward your next role.

You've created your account using: ${email}

What You Can Do Today:
• Track your full interview process, from application to offer, and schedule timely follow-ups
• Set and manage career goals, explore potential paths, compare average salaries, and learn the exact steps to reach your target roles
• Create AI-tailored resumes and cover letters for every job you apply to
• Get personalized support and insights from your AI Career Coach whenever you need direction
• See your next best action automatically based on your current progress and goals
• Organize your projects, achievements, and contacts in one place for quick access and portfolio use

Start Building Your Career OS:
${dashboardUrl}

Need help getting started? Reach out to support@ascentful.io.

We're thrilled to have you on board,
The Ascentful Team`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentful" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <h1 style="color: #0C29AB; font-size: 28px; margin: 0;">Welcome to Ascentful 🚀</h1>
      </div>

      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>

      <p style="font-size: 16px; margin-bottom: 24px;">Welcome to <strong>Ascentful</strong>, the Career OS that helps you plan your path, track progress, and move confidently toward your next role.</p>

      <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 15px;">You've created your account using:</p>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #0C29AB; font-weight: 600;">${email}</p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${dashboardUrl}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 2px 4px rgba(12, 41, 171, 0.2);">
          Start Building Your Career OS →
        </a>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 6px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">What You Can Do Today</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280; line-height: 1.8;">
          <li style="margin-bottom: 12px;">Track your full interview process, from application to offer, and schedule timely follow-ups</li>
          <li style="margin-bottom: 12px;">Set and manage career goals, explore potential paths, compare average salaries, and learn the exact steps to reach your target roles</li>
          <li style="margin-bottom: 12px;">Create AI-tailored resumes and cover letters for every job you apply to</li>
          <li style="margin-bottom: 12px;">Get personalized support and insights from your AI Career Coach whenever you need direction</li>
          <li style="margin-bottom: 12px;">See your next best action automatically based on your current progress and goals</li>
          <li style="margin-bottom: 12px;">Organize your projects, achievements, and contacts in one place for quick access and portfolio use</li>
        </ul>
      </div>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        Need help getting started? Reach out to <a href="mailto:support@ascentful.io" style="color: #0C29AB; text-decoration: none; font-weight: 600;">support@ascentful.io</a>.
      </p>

      <p style="font-size: 16px; margin-top: 32px;">
        We're thrilled to have you on board,<br>
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
 * Send university advisor/admin invitation (Email Template #2)
 * University Admin invites advisor or another admin
 */
export async function sendUniversityAdvisorInvitationEmail(
  email: string,
  firstName: string,
  universityAdminName: string,
  role: string,
  inviteLink: string
): Promise<EmailResult> {
  const subject = `You've Been Invited to Join Ascentful's Team`

  const text = `Hi ${firstName},

${universityAdminName} has invited you to join Ascentful, your university's career development and advising platform.

You've been invited using this email: ${email}

Your account will have ${role} access, allowing you to collaborate with students and manage university data.

Click here to activate your account:
${inviteLink}

What You'll Be Able To Do:
• View and track student progress across career goals and applications
• Leave advising notes and collaborate on student profiles
• Manage departments, programs, and student licenses
• Access dashboards showing engagement and outcomes

If you have any questions, please contact ${universityAdminName} or reach us at support@ascentful.io.

Welcome aboard,
The Ascentful Team`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentful" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <h1 style="color: #0C29AB; font-size: 28px; margin: 0;">You've Been Invited!</h1>
      </div>

      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>

      <p style="font-size: 16px; margin-bottom: 24px;"><strong>${universityAdminName}</strong> has invited you to join <strong>Ascentful</strong>, your university's career development and advising platform.</p>

      <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 15px;">You've been invited using this email:</p>
        <p style="margin: 0; font-size: 16px; color: #0C29AB; font-weight: 600;">${email}</p>
        <p style="margin: 12px 0 0 0; font-size: 14px; color: #6b7280;">Your account will have <strong>${role}</strong> access, allowing you to collaborate with students and manage university data.</p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${inviteLink}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 2px 4px rgba(12, 41, 171, 0.2);">
          Activate Your Account →
        </a>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 6px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">What You'll Be Able To Do</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280; line-height: 1.8;">
          <li style="margin-bottom: 8px;">View and track student progress across career goals and applications</li>
          <li style="margin-bottom: 8px;">Leave advising notes and collaborate on student profiles</li>
          <li style="margin-bottom: 8px;">Manage departments, programs, and student licenses</li>
          <li style="margin-bottom: 8px;">Access dashboards showing engagement and outcomes</li>
        </ul>
      </div>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        If you have any questions, please contact <strong>${universityAdminName}</strong> or reach us at
        <a href="mailto:support@ascentful.io" style="color: #0C29AB; text-decoration: none; font-weight: 600;">support@ascentful.io</a>.
      </p>

      <p style="font-size: 16px; margin-top: 32px;">
        Welcome aboard,<br>
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
 * Send super admin university invitation (Email Template #3)
 * Super Admin invites university admin
 */
export async function sendSuperAdminUniversityInvitationEmail(
  email: string,
  firstName: string,
  universityName: string,
  inviteLink: string
): Promise<EmailResult> {
  const subject = `Your University Has Been Added to Ascentful - Set Up Your Admin Account`

  const text = `Hi ${firstName},

Welcome to Ascentful!

You've been invited to create an Admin account for ${universityName}, giving you full access to your institution's dashboard, student management tools, and analytics.

You've been invited using this email: ${email}

Click here to set up your admin account:
${inviteLink}

With Your Admin Access, You Can:
• Add students, advisors, and department admins
• Manage user licenses and invitations
• Configure university programs and departments
• Review analytics on student engagement and outcomes

If you have any questions or need help getting started, contact your onboarding manager or reach out to support@ascentful.io.

Welcome to Ascentful,
The Ascentful Partnerships Team`

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1f2937; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://xzi7cpcc4c.ufs.sh/f/jgOWCCH530yezbLhC1EM8wQTKjxNoftXCJYv6Emls0pb1qyI" alt="Ascentful" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <h1 style="color: #0C29AB; font-size: 28px; margin: 0;">Welcome to Ascentful!</h1>
      </div>

      <p style="font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>

      <p style="font-size: 16px; margin-bottom: 24px;">You've been invited to create an Admin account for <strong>${universityName}</strong>, giving you full access to your institution's dashboard, student management tools, and analytics.</p>

      <div style="background-color: #f0f4ff; border-left: 4px solid #0C29AB; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 15px;">You've been invited using this email:</p>
        <p style="margin: 0; font-size: 16px; color: #0C29AB; font-weight: 600;">${email}</p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="${inviteLink}"
           style="background-color: #0C29AB;
                  color: white;
                  padding: 14px 32px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: 600;
                  font-size: 16px;
                  display: inline-block;
                  box-shadow: 0 2px 4px rgba(12, 41, 171, 0.2);">
          Set Up My Admin Account →
        </a>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 6px;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #374151;">With Your Admin Access, You Can:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280; line-height: 1.8;">
          <li style="margin-bottom: 8px;">Add students, advisors, and department admins</li>
          <li style="margin-bottom: 8px;">Manage user licenses and invitations</li>
          <li style="margin-bottom: 8px;">Configure university programs and departments</li>
          <li style="margin-bottom: 8px;">Review analytics on student engagement and outcomes</li>
        </ul>
      </div>

      <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">
        If you have any questions or need help getting started, contact your onboarding manager or reach out to
        <a href="mailto:support@ascentful.io" style="color: #0C29AB; text-decoration: none; font-weight: 600;">support@ascentful.io</a>.
      </p>

      <p style="font-size: 16px; margin-top: 32px;">
        Welcome to Ascentful,<br>
        <strong>The Ascentful Partnerships Team</strong>
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
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  name: string,
  amount: number,
  plan: string
) {
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const subject = 'Payment Confirmed - Ascentful Premium'

  const text = `Hi [NAME],

Thank you for upgrading to Ascentful Premium!

Payment Confirmation
Plan: [PLAN]
Amount: [AMOUNT]
Date: [DATE]

Your premium features are now active. You can now:
- Create unlimited applications
- Create unlimited career goals
- Add unlimited network contacts
- Generate unlimited career paths
- Access to AI career coach

You can manage your subscription at https://app.ascentful.io/account/subscription

If you have any questions, contact us at support@ascentful.io

Best regards,
The Ascentful Team`.replace('[NAME]', name).replace('[PLAN]', plan).replace('[AMOUNT]', formattedAmount).replace('[DATE]', new Date().toLocaleDateString())

  const html = '<div>Payment confirmation HTML</div>'

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  })
}
