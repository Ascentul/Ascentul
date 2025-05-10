import fetch from 'node-fetch';

// Test creating a university admin support ticket
async function testUniversitySupportTicket() {
  try {
    console.log('Testing university admin support ticket creation...');
    
    // Create test ticket data for public endpoint
    const ticketData = {
      user_email: 'university_admin_test@university.edu',
      issue_type: 'technical',
      description: 'We are having issues with accessing student reports on the dashboard',
      attachment_url: null
    };
    
    // Send POST request to create the ticket
    const response = await fetch('http://localhost:3000/api/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });
    
    // Check response status
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    // Get the raw text response first
    const responseText = await response.text();
    console.log('Raw response:', responseText.substring(0, 500) + '...');
    
    try {
      // Try to parse as JSON if it looks like JSON
      if (responseText.trim().startsWith('{')) {
        const ticket = JSON.parse(responseText);
        console.log('Support ticket created successfully with ID:', ticket.id);
        console.log('Ticket details:', JSON.stringify(ticket, null, 2));
      }
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
    }
    
    console.log('\nTest completed.');
  } catch (error) {
    console.error('Error testing support ticket creation:', error);
  }
}

testUniversitySupportTicket();
