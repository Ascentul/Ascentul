/**
 * Mailgun email service integration for Ascentul
 * This module provides functions for sending emails using Mailgun
 */
import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Initialize mailgun client
const mailgun = new Mailgun(formData);

// API key will be provided via environment variable
// The domain is mail.ascentul.io
const DEFAULT_DOMAIN = 'mail.ascentul.io';
const DEFAULT_FROM = 'no-reply@mail.ascentul.io';

/**
 * Send an email using Mailgun
 * @param {Object} options Email options
 * @param {string} options.to Recipient email address
 * @param {string} options.from Sender email address (defaults to no-reply@mail.ascentul.io)
 * @param {string} options.subject Email subject line
 * @param {string} options.text Plain text email body
 * @param {string} options.html HTML email body (optional)
 * @param {string} options.domain Mail domain (defaults to mail.ascentul.io)
 * @returns {Promise} Promise that resolves with Mailgun API response
 */
async function sendEmail({
  to,
  from = DEFAULT_FROM,
  subject,
  text,
  html,
  domain = DEFAULT_DOMAIN
}) {
  // Validate required parameters
  if (!to || !subject || !text) {
    throw new Error('Missing required email parameters: to, subject, and text are required.');
  }

  // Check for Mailgun API key - try different potential environment variable names
  const mailgunKey = process.env.MAILGUN_API_KEY || process.env.MAILGUN_KEY || process.env.MG_API_KEY || null;
  
  // Log all available environment variables (excluding those with sensitive names)
  console.log('Looking for Mailgun API key...');
  console.log('Available env vars:', Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('KEY'))
    .join(', '));
  
  if (!mailgunKey) {
    throw new Error('Mailgun API key environment variable is not set. Tried: MAILGUN_API_KEY, MAILGUN_KEY, MG_API_KEY');
  }

  try {
    // Create mailgun client with API key
    const mg = mailgun.client({
      username: 'api',
      key: mailgunKey
    });

    // Create email data object
    const emailData = {
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
    const result = await mg.messages.create(domain, emailData);
    
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
 * @param {string} email User's email address
 * @param {string} name User's name
 * @returns {Promise} Promise that resolves with Mailgun API response
 */
async function sendWelcomeEmail(email, name) {
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
          <li>Explore our AI-powered resume and LinkedIn optimization tools</li>
          <li>Track your job applications in one place</li>
        </ul>
      </div>
      
      <p>Our AI-driven platform adapts to your unique career journey, providing personalized recommendations and insights to help you achieve your professional goals.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://app.ascentul.io/dashboard" style="background-color: #1333c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Start Exploring Now</a>
      </div>
      
      <p>If you have any questions or need assistance, our support team is always here to help.</p>
      
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
 * @param {string} email User's email address
 * @param {string} name User's name
 * @param {string} companyName Company name
 * @param {string} positionTitle Job position title
 * @param {string} newStatus New application status
 * @returns {Promise} Promise that resolves with Mailgun API response
 */
async function sendApplicationUpdateEmail(email, name, companyName, positionTitle, newStatus) {
  // Generate a subject line based on the status
  let subject = '';
  let statusMessage = '';
  
  switch(newStatus.toLowerCase()) {
    case 'applied':
      subject = `Application Submitted: ${positionTitle} at ${companyName}`;
      statusMessage = `Your application for <strong>${positionTitle}</strong> at <strong>${companyName}</strong> has been successfully submitted.`;
      break;
    case 'interview':
    case 'interviewing':
      subject = `Interview Stage: ${positionTitle} at ${companyName}`;
      statusMessage = `Your application for <strong>${positionTitle}</strong> at <strong>${companyName}</strong> has progressed to the interview stage.`;
      break;
    case 'offer':
      subject = `Congratulations! Job Offer for ${positionTitle} at ${companyName}`;
      statusMessage = `Great news! You've received a job offer for <strong>${positionTitle}</strong> at <strong>${companyName}</strong>.`;
      break;
    case 'rejected':
      subject = `Application Update: ${positionTitle} at ${companyName}`;
      statusMessage = `We're sorry to inform you that your application for <strong>${positionTitle}</strong> at <strong>${companyName}</strong> was not selected to move forward.`;
      break;
    case 'closed':
      subject = `Application Closed: ${positionTitle} at ${companyName}`;
      statusMessage = `Your application for <strong>${positionTitle}</strong> at <strong>${companyName}</strong> has been closed.`;
      break;
    default:
      subject = `Application Status Update: ${positionTitle} at ${companyName}`;
      statusMessage = `Your application for <strong>${positionTitle}</strong> at <strong>${companyName}</strong> has been updated to <strong>${newStatus}</strong>.`;
  }
  
  const text = `Hello ${name || 'there'},

Application Status Update

${statusMessage.replace(/<\/?strong>/g, '')}

You can view the full details and track your application progress in your Ascentul dashboard.

Best regards,
The Ascentul Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul Logo" style="max-width: 150px;">
      </div>
      
      <h1 style="color: #1333c2; font-size: 24px; margin-bottom: 20px;">Application Status Update</h1>
      
      <p>Hello ${name || 'there'},</p>
      
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
 * Send a university admin invitation email with a tokenized signup link
 * @param {Object} options - Invitation options
 * @param {string} options.to - Recipient email address
 * @param {string} options.universityName - Name of the university
 * @param {string} options.inviteToken - Secure invitation token
 * @returns {Promise} Promise that resolves with Mailgun API response
 */
async function sendUniversityInviteEmail(options) {
  const { to, universityName, inviteToken } = options;
  
  if (!to || !universityName || !inviteToken) {
    throw new Error('Missing required parameters for university invite email');
  }
  
  const subject = `You're Invited to Manage ${universityName} on Ascentul`;
  
  // URL with the invite token
  const inviteUrl = `https://app.ascentul.io/university-register?token=${inviteToken}`;
  
  const text = `Hello,

You've been invited to join Ascentul as the administrator for ${universityName}.

Ascentul provides career development tools and resources to help your students succeed in their professional journeys. As a university administrator, you'll be able to:

- Manage student accounts
- Track career development progress
- Access detailed analytics and reporting
- Customize resources for your university's needs

To accept this invitation and set up your account, please visit:
${inviteUrl}

This invitation link will expire in 7 days.

Thank you for partnering with Ascentul to support your students' career success!

Best regards,
The Ascentul Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://ascentul.io/logo.png" alt="Ascentul Logo" style="max-width: 150px;">
      </div>
      
      <h1 style="color: #1333c2; font-size: 24px; margin-bottom: 20px;">University Admin Invitation</h1>
      
      <p>Hello,</p>
      
      <p>You've been invited to join Ascentul as the administrator for <strong>${universityName}</strong>.</p>
      
      <div style="background-color: #f5f7ff; border-left: 4px solid #1333c2; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1333c2;">What You'll Be Able to Do</h3>
        <ul style="padding-left: 20px;">
          <li>Manage student accounts and access</li>
          <li>Track student career development progress</li>
          <li>Access detailed analytics and reporting</li>
          <li>Customize resources for your university</li>
        </ul>
      </div>
      
      <p>Ascentul provides comprehensive career development tools and resources designed to help your students succeed in their professional journeys.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" style="background-color: #1333c2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
      </div>
      
      <p style="font-size: 13px;">Or copy and paste this URL into your browser:</p>
      <p style="font-size: 13px; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${inviteUrl}</p>
      
      <p><strong>Note:</strong> This invitation link will expire in 7 days.</p>
      
      <p>Thank you for partnering with Ascentul to support your students' career success!</p>
      
      <p>Best regards,<br>The Ascentul Team</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
        <p>© 2024 Ascentul, Inc. All rights reserved.</p>
        <p>
          <a href="https://ascentul.io/privacy" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://ascentul.io/terms" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Terms of Service</a> | 
          <a href="mailto:support@ascentul.io" style="color: #1333c2; text-decoration: none; margin: 0 10px;">Contact Support</a>
        </p>
        <p>If you received this invitation in error, please disregard this email.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    text,
    html
  });
}

export {
  sendEmail,
  sendWelcomeEmail,
  sendApplicationUpdateEmail,
  sendUniversityInviteEmail
};