/**
 * This script tests the admin support tickets API endpoint
 * 
 * Usage: node test-admin-support-tickets.js
 */

import { pool } from './server/db.js';
import { storage } from './server/storage.js';

async function testAdminSupportTickets() {
  try {
    console.log("Testing admin support tickets API...");
    
    // First, directly query the database to see if tickets exist
    console.log("\nQuerying database directly for university-admin tickets:");
    const dbResult = await pool.query(
      "SELECT * FROM support_tickets WHERE source = 'university-admin'"
    );
    
    console.log(`Found ${dbResult.rows.length} university-admin tickets in database`);
    if (dbResult.rows.length > 0) {
      console.log("First ticket:", dbResult.rows[0]);
    }
    
    // Now let's query our storage layer function directly to check for any issues
    console.log("\nTesting storage.getSupportTickets method:");
    
    // Test with source filter
    const tickets = await storage.getSupportTickets({ source: 'university-admin' });
    console.log(`getSupportTickets returned ${tickets.length} university-admin tickets`);
    if (tickets.length > 0) {
      console.log("First ticket from storage:", tickets[0]);
    }
    
    // Test without filters
    const allTickets = await storage.getSupportTickets();
    console.log(`getSupportTickets with no filter returned ${allTickets.length} total tickets`);
    
    // Check for university-admin tickets in the unfiltered results
    const uniAdminTickets = allTickets.filter(ticket => ticket.source === 'university-admin');
    console.log(`Found ${uniAdminTickets.length} university-admin tickets in unfiltered results`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error testing admin support tickets:", error);
    process.exit(1);
  }
}

testAdminSupportTickets();