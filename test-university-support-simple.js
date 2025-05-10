/**
 * Simple support ticket testing script using direct SQL queries
 */

import pg from 'pg';
const { Client } = pg;

// Main test function
async function testUniversitySupportTickets() {
  console.log('========== UNIVERSITY ADMIN SUPPORT TICKETS TEST ==========');
  
  // Create a PostgreSQL client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Test DB connection
    const timeResult = await client.query('SELECT NOW() as time');
    console.log(`Database time: ${timeResult.rows[0].time}`);
    
    // Create a test support ticket for a university admin
    console.log('\nCreating test university admin support ticket...');
    const insertQuery = `
      INSERT INTO support_tickets (
        user_email, 
        user_name, 
        university_name, 
        subject, 
        source, 
        issue_type, 
        description, 
        priority, 
        department, 
        contact_person, 
        status, 
        created_at, 
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING id
    `;
    
    const now = new Date();
    const values = [
      'university_test@example.edu',  // user_email
      'University Test User',         // user_name
      'Test University',              // university_name
      'Test Support Ticket',          // subject
      'university-admin',             // source
      'technical',                    // issue_type
      'This is a test support ticket for testing university admin functionality.', // description
      'medium',                       // priority
      'Computer Science',             // department
      'Prof. Test Person',            // contact_person
      'Open',                         // status
      now,                            // created_at
      now                             // updated_at
    ];
    
    const result = await client.query(insertQuery, values);
    const ticketId = result.rows[0].id;
    console.log(`Created ticket with ID: ${ticketId}`);
    
    // Retrieve the created ticket
    console.log('\nRetrieving the created ticket...');
    const selectQuery = `
      SELECT * FROM support_tickets WHERE id = $1
    `;
    const ticketResult = await client.query(selectQuery, [ticketId]);
    const ticket = ticketResult.rows[0];
    
    // Display the ticket details
    console.log('\nTicket details:');
    console.log(`ID: ${ticket.id}`);
    console.log(`Subject: ${ticket.subject}`);
    console.log(`Status: ${ticket.status}`);
    console.log(`University: ${ticket.university_name}`);
    console.log(`Department: ${ticket.department}`);
    console.log(`Contact Person: ${ticket.contact_person}`);
    console.log(`Created: ${ticket.created_at}`);
    
    // Verify university-specific fields
    console.log('\nVerifying university-specific fields:');
    if (ticket.department === values[8]) {
      console.log('✓ Department field saved correctly');
    } else {
      console.log(`✗ Department field mismatch: expected "${values[8]}", got "${ticket.department}"`);
    }
    
    if (ticket.contact_person === values[9]) {
      console.log('✓ Contact Person field saved correctly');
    } else {
      console.log(`✗ Contact Person field mismatch: expected "${values[9]}", got "${ticket.contact_person}"`);
    }
    
    if (ticket.university_name === values[2]) {
      console.log('✓ University Name field saved correctly');
    } else {
      console.log(`✗ University Name field mismatch: expected "${values[2]}", got "${ticket.university_name}"`);
    }
    
    // Get all university admin tickets
    console.log('\nRetrieving all university admin tickets...');
    const allTicketsQuery = `
      SELECT id, subject, status, university_name, department, contact_person, created_at 
      FROM support_tickets 
      WHERE source = 'university-admin'
      ORDER BY created_at DESC
    `;
    const allTicketsResult = await client.query(allTicketsQuery);
    
    console.log(`Found ${allTicketsResult.rows.length} university admin tickets:`);
    allTicketsResult.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. #${ticket.id}: "${ticket.subject}" - ${ticket.university_name} (${ticket.status})`);
    });
    
    console.log('\n========== TEST COMPLETED SUCCESSFULLY ==========');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the test
await testUniversitySupportTickets();