/**
 * Direct test script for university support functionality
 */

// Import required modules
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon connection
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Test database connectivity
async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Create a support ticket directly in the database
async function createTestTicket() {
  try {
    // Insert university admin support ticket
    const query = `
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
      ) RETURNING *
    `;
    
    const now = new Date();
    const values = [
      'university_admin@test.edu',          // user_email
      'University Admin Test',              // user_name
      'Test University',                    // university_name
      'Test University Support Ticket',     // subject
      'university-admin',                   // source
      'account_access',                     // issue_type
      'This is a test support ticket for university admins.', // description
      'medium',                             // priority
      'Computer Science Department',        // department
      'Prof. Test Administrator',           // contact_person
      'Open',                               // status
      now,                                  // created_at
      now                                   // updated_at
    ];
    
    const result = await pool.query(query, values);
    console.log('Ticket created successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating test ticket:', error);
    return null;
  }
}

// Verify ticket retrieval with university-specific fields
async function verifyTicket(id) {
  try {
    const query = `
      SELECT * FROM support_tickets WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      console.log('No ticket found with ID:', id);
      return null;
    }
    
    const ticket = result.rows[0];
    console.log('Retrieved ticket:', ticket);
    
    // Verify university-specific fields
    console.log('\nVerifying university-specific fields:');
    console.log(`- Department: ${ticket.department || 'MISSING'}`);
    console.log(`- Contact Person: ${ticket.contact_person || 'MISSING'}`);
    console.log(`- University Name: ${ticket.university_name || 'MISSING'}`);
    console.log(`- Source: ${ticket.source || 'MISSING'}`);
    
    return ticket;
  } catch (error) {
    console.error('Error verifying ticket:', error);
    return null;
  }
}

// Get all university-admin tickets
async function getUniversityTickets() {
  try {
    const query = `
      SELECT * FROM support_tickets 
      WHERE source = 'university-admin'
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    console.log(`Found ${result.rows.length} university admin tickets`);
    
    // Show a summary of each ticket
    if (result.rows.length > 0) {
      console.log('\nUniversity Ticket Summary:');
      result.rows.forEach(ticket => {
        console.log(`- #${ticket.id}: ${ticket.subject} (${ticket.status}) - ${ticket.department || 'No department'}`);
      });
    }
    
    return result.rows;
  } catch (error) {
    console.error('Error getting university tickets:', error);
    return [];
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('========== TESTING UNIVERSITY ADMIN SUPPORT FUNCTIONALITY ==========\n');
    
    // Test 1: Database Connection
    console.log('TEST 1: Verifying database connection...');
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection test failed');
    }
    console.log('Database connection test passed!\n');
    
    // Test 2: Create Test Ticket
    console.log('TEST 2: Creating test university admin support ticket...');
    const createdTicket = await createTestTicket();
    if (!createdTicket) {
      throw new Error('Failed to create test ticket');
    }
    console.log('Test ticket created with ID:', createdTicket.id, '\n');
    
    // Test 3: Verify Ticket
    console.log(`TEST 3: Verifying ticket #${createdTicket.id}...`);
    const verifiedTicket = await verifyTicket(createdTicket.id);
    if (!verifiedTicket) {
      throw new Error('Failed to verify ticket');
    }
    console.log('Ticket verification passed!\n');
    
    // Test 4: Get All University Tickets
    console.log('TEST 4: Retrieving all university-admin tickets...');
    const tickets = await getUniversityTickets();
    console.log(`Retrieved ${tickets.length} university admin tickets\n`);
    
    console.log('========== ALL TESTS COMPLETED SUCCESSFULLY ==========');
  } catch (error) {
    console.error('TESTING FAILED:', error.message);
  } finally {
    // Close the pool regardless of test outcome
    await pool.end();
  }
}

// Run the tests
await runTests();