/**
 * This script directly tests the database for university admin support tickets 
 * 
 * Usage: node test-admin-support-tickets.cjs
 */

const { Pool } = require('pg');

async function testAdminSupportTickets() {
  try {
    console.log("Testing admin support tickets API...");
    
    // Create a connection to PostgreSQL using DATABASE_URL
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable not set");
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    // First, directly query the database to see if tickets exist
    console.log("\nQuerying database directly for university-admin tickets:");
    const dbResult = await pool.query(
      "SELECT * FROM support_tickets WHERE source = 'university-admin'"
    );
    
    console.log(`Found ${dbResult.rows.length} university-admin tickets in database`);
    if (dbResult.rows.length > 0) {
      console.log("First ticket:", JSON.stringify(dbResult.rows[0], null, 2));
    }
    
    // Check the admin/support-tickets endpoint route
    console.log("\nChecking route registration in server/routes.ts:");
    const routeCheck = await pool.query(
      "SELECT * FROM support_tickets"
    );
    
    console.log(`Total tickets in database: ${routeCheck.rows.length}`);
    
    // Group tickets by source
    const ticketsBySource = {};
    routeCheck.rows.forEach(ticket => {
      if (!ticketsBySource[ticket.source]) {
        ticketsBySource[ticket.source] = 0;
      }
      ticketsBySource[ticket.source]++;
    });
    
    console.log("Tickets by source:", ticketsBySource);
    
    // Close the connection
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error("Error testing admin support tickets:", error);
    process.exit(1);
  }
}

testAdminSupportTickets();