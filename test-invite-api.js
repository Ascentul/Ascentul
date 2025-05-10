/**
 * Test script for university invitation email functionality
 * Uses the API directly through the server.
 */
import { db } from './server/db.js';
import { users, invites } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { sendUniversityInviteEmail } from './server/mail.js';

async function testInviteApi() {
  try {
    // Generate a test email with a timestamp
    const testEmail = `test-university-admin-${Date.now()}@example.com`;
    const testToken = Math.random().toString(36).substring(2, 15);
    const universityName = 'Test University';
    
    console.log(`Testing university admin invitation for ${testEmail}`);
    
    // Test the email sending function directly
    console.log('Sending test invitation email...');
    try {
      const emailResult = await sendUniversityInviteEmail(
        testEmail,
        testToken,
        universityName
      );
      
      console.log('Email sent successfully:', emailResult);
      console.log(`Check that email was sent to ${testEmail}`);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
    
    console.log('Test completed.');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Clean up: close database connection
    await db.disconnect();
  }
}

// Run the test
testInviteApi();