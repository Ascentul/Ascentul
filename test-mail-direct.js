/**
 * Direct test for Mailgun email functionality
 * This test directly calls Mailgun API to verify email functionality
 */

import formData from 'form-data';
import Mailgun from 'mailgun.js';

// Initialize mailgun client
const mailgun = new Mailgun(formData);

async function testMailgunEmail() {
  try {
    // Check for Mailgun API key
    if (!process.env.MAILGUN_API_KEY) {
      console.error('MAILGUN_API_KEY environment variable is not set.');
      return;
    }
    
    console.log('MAILGUN_API_KEY is set, proceeding with test...');
    
    // Create mailgun client with API key
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    });
    
    const domain = 'mail.ascentul.io';
    const from = 'no-reply@mail.ascentul.io';
    
    // Generate a test email address with a timestamp
    const testEmail = `test-university-admin-${Date.now()}@example.com`;
    
    // Create email content
    const emailData = {
      from: from,
      to: testEmail,
      subject: 'Test University Admin Invitation',
      text: `This is a test university admin invitation email. It was generated at ${new Date().toISOString()} as part of testing the email functionality.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #1333c2; font-size: 24px; margin-bottom: 20px;">Test University Admin Invitation</h1>
          <p>This is a test university admin invitation email.</p>
          <p>It was generated at <strong>${new Date().toISOString()}</strong> as part of testing the email functionality.</p>
        </div>
      `
    };
    
    console.log(`Sending test email to ${testEmail}...`);
    
    // Send email via Mailgun
    try {
      const result = await mg.messages.create(domain, emailData);
      console.log('Email sent successfully:', {
        to: testEmail,
        messageId: result.id || `msg_${Date.now()}`,
        message: result.message || 'Email sent'
      });
    } catch (error) {
      console.error('Mailgun email error:', error);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testMailgunEmail().then(() => console.log('Test completed.'));