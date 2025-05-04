/**
 * Test script for sending emails using the Mailgun integration
 * 
 * Usage:
 * node sendTestEmail.js <email> [type]
 * 
 * Arguments:
 * - email: The recipient email address
 * - type: Optional. The type of email to send. Defaults to 'test'.
 *         Possible values: 'test', 'welcome', 'application'
 * 
 * Environment variables:
 * - MAILGUN_API_KEY: The Mailgun API key
 * 
 * Examples:
 * node sendTestEmail.js user@example.com
 * node sendTestEmail.js user@example.com welcome
 * node sendTestEmail.js user@example.com application
 */

import { sendEmail, sendWelcomeEmail, sendApplicationUpdateEmail } from './server/mail.js';

// Main function
async function main() {
  // Check for Mailgun API key
  if (!process.env.MAILGUN_API_KEY) {
    console.error('Error: MAILGUN_API_KEY environment variable is not set.');
    console.error('Please set it before running this script:');
    console.error('  export MAILGUN_API_KEY=your-api-key');
    process.exit(1);
  }
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Error: Missing recipient email address.');
    console.error('Usage: node sendTestEmail.js <email> [type]');
    process.exit(1);
  }
  
  const email = args[0];
  const type = args[1] || 'test';
  
  try {
    console.log(`Sending ${type} email to ${email}...`);
    
    let result;
    
    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(email, 'Test User');
        break;
      
      case 'application':
        result = await sendApplicationUpdateEmail(
          email,
          'Test User',
          'Example Company',
          'Software Engineer',
          'interview'
        );
        break;
      
      case 'test':
      default:
        result = await sendEmail({
          to: email,
          subject: 'Test Email from Ascentul',
          text: 'This is a test email sent via the Mailgun API.',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
              <h1 style="color: #1333c2;">Test Email</h1>
              <p>Hello,</p>
              <p>This is a test email sent via the Mailgun API integration in Ascentul.</p>
              <p>If you're seeing this, it means the email functionality is working correctly!</p>
              <p>Best regards,<br>The Ascentul Team</p>
            </div>
          `
        });
        break;
    }
    
    console.log('Email sent successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error sending email:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the main function
main();