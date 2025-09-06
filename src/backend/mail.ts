/**
 * Mailgun email service integration for Ascentul
 * This module provides functions for sending emails using Mailgun
 */
import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Define our own type for the Mailgun response since the package lacks proper typings
interface MessagesSendResult {
  id: string;
  message: string;
  status: number;
}

// Initialize mailgun client
const mailgun = new Mailgun(formData);

// API key will be provided via environment variable
// The domain is mail.ascentul.io
const DEFAULT_DOMAIN = 'mail.ascentul.io';
const DEFAULT_FROM = 'no-reply@mail.ascentul.io';

// Define interface for email options
interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  text: string;
  html?: string;
  domain?: string;
}

/**
 * Send an email using Mailgun
 * @param options Email options
 * @returns Promise that resolves with Mailgun API response
 */
async function sendEmail({
  to,
  from = DEFAULT_FROM,
  subject,
  text,
  html,
  domain = DEFAULT_DOMAIN
}: EmailOptions): Promise<MessagesSendResult> {
  // Validate required parameters
  if (!to || !subject || !text) {
    throw new Error('Missing required email parameters: to, subject, and text are required.');
  }

  // Check for Mailgun API key
  if (!process.env.MAILGUN_API_KEY) {
    throw new Error('MAILGUN_API_KEY environment variable is not set.');
  }

  try {
    // Create mailgun client with API key
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    });

    // Create email data object with optional properties
    const emailData: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html?: string;
    } = {
      from,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      text
    };

    // Add HTML content if provided
    if (html) {
      emailData.html = html;
    }

    // Send email via Mailgun
    const mailgunResult = await mg.messages.create(domain, emailData);
    
    // Convert to our internal type
    const result: MessagesSendResult = {
      id: mailgunResult.id || `msg_${Date.now()}`,
      message: mailgunResult.message || 'Email sent',
      status: 200
    };
    
    console.log('Email sent successfully:', {
      to,
      subject,
      messageId: result.id
    });
    
    return result;
  } catch (error) {
    console.error('Mailgun email error:', error);
    throw error;
  }
}

/**
 * Send a welcome email to a new user
 * @param email User's email address
 * @param name User's name
 * @returns Promise that resolves with Mailgun API response
 */
async function sendWelcomeEmail(email: string, name?: string): Promise<MessagesSendResult> {
  const subject = '🎉 Welcome to Ascentul - Your Career Growth Partner';
  
  const text = `Hello ${name || 'there'},

Welcome to Ascentul! We're excited to have you join our platform.

Here at Ascentul, we're dedicated to helping you achieve your career goals through personalized guidance, powerful tools, and cutting-edge AI assistance.

To get started:
1. Complete your professional profile
2. Set your first career goal
3. Explore our AI tools to optimize your resume and LinkedIn profile

If you have any questions or need assistance, don't hesitate to reach out to our support team.

Best regards,
The Ascentul Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul Logo" style="max-width: 150px;">
      </div>
      
      <h1 style="color: #1333c2; font-size: 24px; margin-bottom: 20px;">Welcome to Ascentul!</h1>
      
      <p>Hello ${name || 'there'},</p>
      
      <p>We're <strong>thrilled</strong> to have you join the Ascentul community! Our mission is to empower your career growth with intelligent tools and resources.</p>
      
      <div style="background-color: #f5f7ff; border-left: 4px solid #1333c2; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1333c2;">Getting Started Is Easy</h3>
        <ul style="padding-left: 20px;">
          <li>Complete your professional profile</li>
          <li>Set your first career goal</li>
          <li>Explore our AI tools to optimize your resume and LinkedIn profile</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://app.ascentul.io/dashboard" style="background-color: #1333c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Dashboard</a>
      </div>
      
      <p>We're excited to be part of your professional journey and help you reach new heights in your career.</p>
      
      <p>Best regards,<br>The Ascentul Team</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>© 2024 Ascentul, Inc. All rights reserved.</p>
        <p>
          <a href="https://ascentul.io/privacy" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://ascentul.io/terms" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
          <a href="mailto:support@ascentul.io" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Contact Support</a>
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

/**
 * Send a notification email when a user's application status changes
 * @param email User's email address
 * @param name User's name
 * @param companyName Company name
 * @param positionTitle Job position title
 * @param newStatus New application status
 * @returns Promise that resolves with Mailgun API response
 */
async function sendApplicationUpdateEmail(
  email: string, 
  name: string,
  companyName: string, 
  positionTitle: string, 
  newStatus: string
): Promise<MessagesSendResult> {
  // Generate appropriate subject and status message based on the new status
  let subject = '';
  let statusMessage = '';
  
  // Customize message based on application status
  switch (newStatus.toLowerCase()) {
    case 'applied':
      subject = `Application Submitted: ${positionTitle} at ${companyName}`;
      statusMessage = 'Your application has been successfully submitted!';
      break;
    case 'interview':
      subject = `Interview Scheduled: ${positionTitle} at ${companyName}`;
      statusMessage = 'Congratulations! You have been selected for an interview.';
      break;
    case 'offer':
      subject = `Job Offer Received: ${positionTitle} at ${companyName}`;
      statusMessage = 'Congratulations! You have received a job offer.';
      break;
    case 'rejected':
      subject = `Application Update: ${positionTitle} at ${companyName}`;
      statusMessage = 'Thank you for your interest. The company has decided to move forward with other candidates.';
      break;
    case 'accepted':
      subject = `Offer Accepted: ${positionTitle} at ${companyName}`;
      statusMessage = 'Congratulations on accepting the offer! We wish you success in your new role.';
      break;
    default:
      subject = `Application Status Update: ${positionTitle} at ${companyName}`;
      statusMessage = `Your application status has been updated to "${newStatus}".`;
  }
  
  // Plain text email version
  const text = `Hello ${name},

Your application for ${positionTitle} at ${companyName} has been updated.

${statusMessage}

Application Details:
- Position: ${positionTitle}
- Company: ${companyName}
- Status: ${newStatus}

You can view all your applications in the Ascentul Application Tracker.

Best regards,
The Ascentul Team`;

  // HTML email version with styling
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul Logo" style="max-width: 150px;">
      </div>
      
      <h1 style="color: #1333c2; font-size: 24px; margin-bottom: 20px;">Application Status Update</h1>
      
      <p>Hello ${name},</p>
      
      <p>Your application for <strong>${positionTitle}</strong> at <strong>${companyName}</strong> has been updated.</p>
      
      <div style="background-color: #f5f7ff; border-left: 4px solid #1333c2; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;">${statusMessage}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #eee;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Position:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${positionTitle}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Company:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${companyName}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Status:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${newStatus}</td>
        </tr>
      </table>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://app.ascentul.io/applications" style="background-color: #1333c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Applications</a>
      </div>
      
      <p>Stay on top of your job search with Ascentul's Application Tracker. Keep all your applications organized and receive timely updates throughout your career journey.</p>
      
      <p>Best regards,<br>The Ascentul Team</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>© 2024 Ascentul, Inc. All rights reserved.</p>
        <p>
          <a href="https://ascentul.io/privacy" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://ascentul.io/terms" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
          <a href="mailto:support@ascentul.io" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Contact Support</a>
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

/**
 * Send a university administrator invitation email
 * @param email Recipient email address
 * @param inviteToken The token for verifying and accepting the invitation
 * @param universityName Name of the university
 * @returns Promise that resolves with Mailgun API response
 */
async function sendUniversityInviteEmail(
  email: string,
  inviteToken: string,
  universityName: string
): Promise<MessagesSendResult> {
  const subject = `Invitation to Join Ascentul as University Administrator`;
  const verifyUrl = `https://app.ascentul.io/verify-invite/${inviteToken}`;
  
  // Plain text email version
  const text = `Hello,

You have been invited to join Ascentul as a University Administrator for ${universityName}.

To accept this invitation, please click the link below:
${verifyUrl}

This invitation will expire in 7 days.

Best regards,
The Ascentul Team`;

  // HTML email version with styling
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul Logo" style="max-width: 150px;">
      </div>
      
      <h1 style="color: #1333c2; font-size: 24px; margin-bottom: 20px;">University Administrator Invitation</h1>
      
      <p>Hello,</p>
      
      <p>You have been invited to join Ascentul as a <strong>University Administrator</strong> for <strong>${universityName}</strong>.</p>
      
      <div style="background-color: #f5f7ff; border-left: 4px solid #1333c2; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;">As a University Administrator, you'll be able to manage university-specific resources, student access, and reporting.</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #1333c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
      
      <p>Best regards,<br>The Ascentul Team</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>© 2024 Ascentul, Inc. All rights reserved.</p>
        <p>
          <a href="https://ascentul.io/privacy" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://ascentul.io/terms" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
          <a href="mailto:support@ascentul.io" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Contact Support</a>
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

/**
 * Send a support ticket confirmation email to the user
 * @param email User's email address
 * @param subject Ticket subject
 * @returns Promise that resolves with Mailgun API response
 */
async function sendSupportConfirmationEmail(email: string, subject: string): Promise<MessagesSendResult> {
  const confSubject = `Support Ticket Received: ${subject}`;
  const text = `Hello,

We have received your support request with the subject: "${subject}".
Our team will review your ticket and get back to you as soon as possible.

Thank you for reaching out to Ascentul Support!

Best,
The Ascentul Team`;
  const html = `<div style="font-family: Arial, sans-serif; color: #222;">
    <h2>Support Ticket Received</h2>
    <p>We have received your support request with the subject: <strong>"${subject}"</strong>.</p>
    <p>Our team will review your ticket and get back to you as soon as possible.</p>
    <p>Thank you for reaching out to Ascentul Support!</p>
    <br />
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
      <p>© 2025 Ascentul, Inc. All rights reserved.</p>
      <p>
        <a href="https://ascentul.io/privacy" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Privacy Policy</a> |
        <a href="https://ascentul.io/terms" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Terms of Service</a> |
        <a href="mailto:support@ascentul.io" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Contact Support</a>
      </p>
    </div>
  </div>`;
  return sendEmail({
    to: email,
    subject: confSubject,
    text,
    html
  });
}

/**
 * Send support acknowledgement email using the provided template
 * Subject: We’ve received your support request 
 * Body:
 * Hi {{first_name}},
 * Thanks for reaching out to the Ascentul team - we’ve received your support request and our team is reviewing it now.
 * Here’s what happens next:
 * We’ll assign your ticket to the right team member.
 * You’ll get a follow-up within 72 hours with an update or solution.
 * If we need more details, we’ll contact you directly.
 * We’re here to make sure you get the most out of Ascentul. Thanks for giving us the chance to help.
 * Best,
 * The Ascentul Team
 */
export async function sendSupportAcknowledgementEmail(
  email: string,
  firstName: string
): Promise<MessagesSendResult> {
  const subject = `We’ve received your support request ✅`;
  const safeFirst = firstName && firstName.trim().length > 0 ? firstName.trim() : 'there';
  const text = `Hi ${safeFirst},

Thanks for reaching out to the Ascentul team - we’ve received your support request and our team is reviewing it now.

Here’s what happens next:
• We’ll assign your ticket to the right team member.
• You’ll get a follow-up within 72 hours with an update or solution.
• If we need more details, we’ll contact you directly.

We’re here to make sure you get the most out of Ascentul. Thanks for giving us the chance to help.

Best,
The Ascentul Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul Logo" style="max-width: 150px;">
      </div>
      <p>Hi ${safeFirst},</p>
      <p>Thanks for reaching out to the Ascentul team – we’ve received your support request and our team is reviewing it now.</p>
      <p>Here’s what happens next:</p>
      <ul>
        <li>We’ll assign your ticket to the right team member.</li>
        <li>You’ll get a follow-up within <strong>72 hours</strong> with an update or solution.</li>
        <li>If we need more details, we’ll contact you directly.</li>
      </ul>
      <p>We’re here to make sure you get the most out of Ascentul. Thanks for giving us the chance to help.</p>
      <p>Best,<br/>The Ascentul Team</p>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>© ${new Date().getFullYear()} Ascentul, Inc. All rights reserved.</p>
        <p>
          <a href="https://ascentul.io/privacy" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Privacy Policy</a> |
          <a href="https://ascentul.io/terms" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Terms of Service</a> |
          <a href="mailto:support@ascentul.io" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Contact Support</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html
  });
}

export {
  sendEmail,
  sendWelcomeEmail,
  sendApplicationUpdateEmail,
  sendUniversityInviteEmail,
  sendSupportConfirmationEmail
};