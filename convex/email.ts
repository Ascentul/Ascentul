/**
 * Convex actions for sending emails
 * Actions can call external services like Mailgun/SendGrid
 */

"use node"

import { action } from "./_generated/server"
import { v } from "convex/values"

/**
 * Send activation email to newly created user
 * This is an action because it calls external email service
 */
export const sendActivationEmail = action({
  args: {
    email: v.string(),
    name: v.string(),
    tempPassword: v.string(),
    activationToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Import email module (only available in actions, not mutations)
    const { sendActivationEmail: sendEmail } = await import("../src/lib/email")

    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentul.io'}/activate/${args.activationToken}`

    try {
      const result = await sendEmail(
        args.email,
        args.name,
        args.tempPassword,
        activationUrl
      )

      return {
        success: true,
        messageId: result.id,
        message: "Activation email sent successfully",
      }
    } catch (error) {
      console.error("Failed to send activation email:", error)

      // In development or when email service is not configured,
      // don't fail the user creation - just log the error
      const errorMessage = (error as Error).message
      if (errorMessage.includes('No email service configured') ||
          errorMessage.includes('MAILGUN_SENDING_API_KEY') ||
          errorMessage.includes('SENDGRID_API_KEY')) {
        console.warn("Email service not configured - user created but activation email not sent")
        return {
          success: false,
          messageId: null,
          message: "User created successfully, but activation email could not be sent (email service not configured)",
        }
      }

      // For other errors, still throw
      throw new Error("Failed to send activation email: " + errorMessage)
    }
  },
})

/**
 * Send support ticket response email
 */
export const sendSupportTicketResponseEmail = action({
  args: {
    email: v.string(),
    name: v.string(),
    ticketSubject: v.string(),
    responseMessage: v.string(),
    ticketId: v.string(),
  },
  handler: async (ctx, args) => {
    const { sendSupportTicketResponseEmail: sendEmail } = await import("../src/lib/email")

    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentul.io'}/support/${args.ticketId}`

    try {
      const result = await sendEmail(
        args.email,
        args.name,
        args.ticketSubject,
        args.responseMessage,
        ticketUrl
      )

      return {
        success: true,
        messageId: result.id,
        message: "Support ticket response email sent successfully",
      }
    } catch (error) {
      console.error("Failed to send support ticket response email:", error)
      // Return failure but don't throw - email is non-critical
      return {
        success: false,
        messageId: null,
        message: "Email service not configured: " + (error as Error).message,
      }
    }
  },
})

/**
 * Send welcome email to self-registered user
 */
export const sendWelcomeEmail = action({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { sendWelcomeEmail: sendEmail } = await import("../src/lib/email")

    try {
      const result = await sendEmail(args.email, args.name)

      return {
        success: true,
        messageId: result.id,
        message: "Welcome email sent successfully",
      }
    } catch (error) {
      console.error("Failed to send welcome email:", error)
      throw new Error("Failed to send welcome email: " + (error as Error).message)
    }
  },
})

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = action({
  args: {
    email: v.string(),
    name: v.string(),
    resetToken: v.string(),
  },
  handler: async (ctx, args) => {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentul.io'}/reset-password/${args.resetToken}`

    const subject = "Reset Your Ascentul Password"
    const text = `Hello ${args.name},

We received a request to reset your password for your Ascentul account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Ascentul Team`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://ascentul.io/logo.png" alt="Ascentul" style="max-width: 150px;">
        </div>

        <h1 style="color: #0C29AB; font-size: 24px; margin-bottom: 20px;">Reset Your Password</h1>

        <p>Hello ${args.name},</p>

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

    try {
      const { sendEmail } = await import("../src/lib/email")
      const result = await sendEmail({
        to: args.email,
        subject,
        text,
        html,
      })

      return {
        success: true,
        messageId: result.id,
        message: "Password reset email sent successfully",
      }
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      throw new Error("Failed to send password reset email: " + (error as Error).message)
    }
  },
})
