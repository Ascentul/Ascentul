const { storage } = require('./server/storage');

// Test creating a university admin support ticket
async function testSupportTicket() {
  try {
    // Create a test support ticket
    const testTicket = {
      userEmail: 'university_admin@test.edu',
      userName: 'University Admin Test',
      universityName: 'Test University',
      subject: 'Test Support Ticket',
      source: 'university-admin',
      issueType: 'technical',
      description: 'This is a test support ticket for university admins',
      priority: 'medium',
      department: 'Computer Science',
      contactPerson: 'Prof. Test',
      status: 'Open'
    };
    
    console.log('Creating test support ticket...');
    const ticket = await storage.createSupportTicket(testTicket);
    console.log('Support ticket created with ID:', ticket.id);
    console.log('Support ticket details:', JSON.stringify(ticket, null, 2));
    
    // Test retrieving the ticket
    console.log('\nRetrieving support ticket...');
    const retrievedTicket = await storage.getSupportTicket(ticket.id);
    console.log('Retrieved ticket:', JSON.stringify(retrievedTicket, null, 2));
    
    // Test retrieving all tickets with filter
    console.log('\nRetrieving all university-admin tickets...');
    const tickets = await storage.getSupportTickets({ source: 'university-admin' });
    console.log(`Found ${tickets.length} university admin tickets`);
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing support tickets:', error);
  }
}

testSupportTicket();
