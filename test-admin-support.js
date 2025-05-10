/**
 * Test script to verify that university admin support tickets are visible in admin dashboard
 */
import pg from 'pg';
const { Pool } = pg;

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testAdminSupportTickets() {
  console.log('Testing admin support tickets...');
  
  try {
    // Check all support tickets
    const allTicketsResult = await pool.query('SELECT * FROM support_tickets');
    console.log(`Found ${allTicketsResult.rows.length} total support tickets`);
    
    // Check specifically for university admin tickets
    const uniAdminTicketsResult = await pool.query("SELECT * FROM support_tickets WHERE source = 'university-admin'");
    console.log(`Found ${uniAdminTicketsResult.rows.length} university admin support tickets`);
    
    // Print details of university admin tickets
    if (uniAdminTicketsResult.rows.length > 0) {
      console.log('\nUniversity Admin Support Tickets:');
      uniAdminTicketsResult.rows.forEach((ticket, index) => {
        console.log(`\nTicket #${index + 1}:`);
        console.log(`  ID: ${ticket.id}`);
        console.log(`  Source: ${ticket.source}`);
        console.log(`  Issue Type: ${ticket.issue_type}`);
        console.log(`  Status: ${ticket.status}`);
        console.log(`  User Email: ${ticket.user_email}`);
        console.log(`  University Name: ${ticket.university_name}`);
        console.log(`  Department: ${ticket.department}`);
        console.log(`  Contact Person: ${ticket.contact_person}`);
        console.log(`  Description: ${ticket.description.substring(0, 100)}${ticket.description.length > 100 ? '...' : ''}`);
      });
    }
    
    // Verify database schema to ensure all needed fields are present
    const schemaResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'support_tickets'
    `);
    
    console.log('\nSupport Tickets Table Schema:');
    schemaResult.rows.forEach(column => {
      console.log(`  ${column.column_name}: ${column.data_type}`);
    });
    
  } catch (error) {
    console.error('Error testing admin support tickets:', error);
  } finally {
    // Close pool connection
    await pool.end();
  }
}

testAdminSupportTickets();