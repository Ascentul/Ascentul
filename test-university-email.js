/**
 * Test specifically for the university invite email functionality
 */

// Import the sendUniversityInviteEmail function directly 
// (workaround for module import issues)
const mailModule = require('./server/mail.js');

async function testUniversityEmail() {
  // Extract the sendUniversityInviteEmail function from the module
  const { sendUniversityInviteEmail } = mailModule;
  
  if (!sendUniversityInviteEmail) {
    console.error('Could not find sendUniversityInviteEmail function in mail module');
    return;
  }
  
  try {
    // Generate test data with timestamp
    const testEmail = `test-university-admin-${Date.now()}@example.com`;
    const testToken = `token-${Date.now()}`;
    const universityName = 'Stanford University';
    
    console.log(`Testing university admin invitation email for ${testEmail}`);
    console.log(`Using test token: ${testToken}`);
    console.log(`University: ${universityName}`);
    
    // Call the function directly
    const result = await sendUniversityInviteEmail(
      testEmail,
      testToken,
      universityName
    );
    
    console.log('Email sent successfully:', {
      to: testEmail,
      messageId: result.id || 'unknown',
      message: result.message || 'Email sent'
    });
    
  } catch (error) {
    console.error('Error sending university invite email:', error);
  }
}

// Run the test
testUniversityEmail().then(() => console.log('Test completed.'));