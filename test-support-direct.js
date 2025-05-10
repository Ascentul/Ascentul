/**
 * Direct test script for university support ticket submission
 * 
 * This script directly inserts a test support ticket into the database
 * using the storage API to test the functionality.
 */

import { pool } from './server/db.js';
import { InsertSupportTicket } from './shared/schema.js';
import { insertSupportTicketSchema } from './shared/schema.js';

// Function to create a support ticket directly in the database
async function createSupportTicket(data) {
  try {
    const now = new Date();
    
    // Prepare column names and parameter values
    const columns = [];
    const values = [];
    const placeholders = [];
    let paramCounter = 1;
    
    // User information
    if (data.userEmail !== undefined) {
      columns.push('user_email');
      values.push(data.userEmail);
      placeholders.push(`$${paramCounter++}`);
    }
    
    if (data.userName !== undefined) {
      columns.push('user_name');
      values.push(data.userName);
      placeholders.push(`$${paramCounter++}`);
    }
    
    if (data.universityName !== undefined) {
      columns.push('university_name');
      values.push(data.universityName);
      placeholders.push(`$${paramCounter++}`);
    }
    
    // Ticket details
    if (data.subject !== undefined) {
      columns.push('subject');
      values.push(data.subject);
      placeholders.push(`$${paramCounter++}`);
    }
    
    columns.push('source');
    values.push(data.source);
    placeholders.push(`$${paramCounter++}`);
    
    columns.push('issue_type');
    values.push(data.issueType);
    placeholders.push(`$${paramCounter++}`);
    
    columns.push('description');
    values.push(data.description);
    placeholders.push(`$${paramCounter++}`);
    
    if (data.priority !== undefined) {
      columns.push('priority');
      values.push(data.priority);
      placeholders.push(`$${paramCounter++}`);
    }
    
    if (data.attachmentUrl !== undefined) {
      columns.push('attachment_url');
      values.push(data.attachmentUrl);
      placeholders.push(`$${paramCounter++}`);
    }
    
    // University-specific fields
    if (data.department !== undefined) {
      columns.push('department');
      values.push(data.department);
      placeholders.push(`$${paramCounter++}`);
    }
    
    if (data.contactPerson !== undefined) {
      columns.push('contact_person');
      values.push(data.contactPerson);
      placeholders.push(`$${paramCounter++}`);
    }
    
    // Status and timestamps
    columns.push('status');
    values.push(data.status || 'Open');
    placeholders.push(`$${paramCounter++}`);
    
    columns.push('created_at');
    values.push(now);
    placeholders.push(`$${paramCounter++}`);
    
    columns.push('updated_at');
    values.push(now);
    placeholders.push(`$${paramCounter++}`);
    
    // Create the query
    const query = `
      INSERT INTO support_tickets (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    // Execute the query
    const result = await pool.query(query, values);
    const row = result.rows[0];
    
    // Return the created ticket
    return {
      id: row.id,
      userEmail: row.user_email,
      userName: row.user_name,
      universityName: row.university_name,
      subject: row.subject,
      source: row.source,
      issueType: row.issue_type,
      description: row.description,
      priority: row.priority,
      attachmentUrl: row.attachment_url,
      status: row.status,
      internalNotes: row.internal_notes,
      department: row.department,
      contactPerson: row.contact_person,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at
    };
  } catch (error) {
    console.error("Error creating support ticket:", error);
    throw error;
  }
}

// Function to fetch a support ticket by ID
async function getSupportTicket(id) {
  try {
    const query = `
      SELECT * FROM support_tickets
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return undefined;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      userEmail: row.user_email,
      userName: row.user_name,
      universityName: row.university_name,
      subject: row.subject,
      source: row.source,
      issueType: row.issue_type,
      description: row.description,
      priority: row.priority,
      attachmentUrl: row.attachment_url,
      status: row.status,
      internalNotes: row.internal_notes,
      department: row.department,
      contactPerson: row.contact_person,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at
    };
  } catch (error) {
    console.error(`Error fetching support ticket with ID ${id}:`, error);
    return undefined;
  }
}

// Main test function
async function testUniversitySupportTicket() {
  try {
    console.log('========== UNIVERSITY ADMIN SUPPORT TICKET TEST ==========');
    
    // Create a test support ticket
    console.log('\n1. Creating a university support ticket...');
    const supportTicket = {
      userEmail: 'university_admin@test.edu',
      userName: 'University Admin Test',
      universityName: 'Test University',
      subject: 'Test University Support Ticket',
      source: 'university-admin',
      issueType: 'account_access',
      description: 'This is a test support ticket for university administrators.',
      priority: 'medium',
      department: 'Computer Science Department',
      contactPerson: 'Prof. Test Administrator',
      status: 'Open'
    };
    
    // Validate ticket data with the schema
    const validatedTicket = insertSupportTicketSchema.parse(supportTicket);
    console.log('Validated ticket data:', validatedTicket);
    
    // Create the ticket in the database
    const createdTicket = await createSupportTicket(validatedTicket);
    console.log('\nSupport ticket created successfully with ID:', createdTicket.id);
    console.log('Support ticket details:', JSON.stringify(createdTicket, null, 2));
    
    // Verify the ticket exists by fetching it
    if (createdTicket.id) {
      console.log(`\n2. Verifying ticket #${createdTicket.id} exists...`);
      const retrievedTicket = await getSupportTicket(createdTicket.id);
      console.log('Retrieved ticket:', JSON.stringify(retrievedTicket, null, 2));
      
      // Verify the university-specific fields were saved correctly
      console.log('\n3. Verifying university-specific fields...');
      console.log(`Department: ${retrievedTicket.department === supportTicket.department ? 'MATCH ✓' : 'MISMATCH ✗'}`);
      console.log(`Contact Person: ${retrievedTicket.contactPerson === supportTicket.contactPerson ? 'MATCH ✓' : 'MISMATCH ✗'}`);
      console.log(`University Name: ${retrievedTicket.universityName === supportTicket.universityName ? 'MATCH ✓' : 'MISMATCH ✗'}`);
    }
    
    console.log('\n========== TEST COMPLETED SUCCESSFULLY ==========');
    
    // Close the database pool
    await pool.end();
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await pool.end();
  }
}

// Run the test
await testUniversitySupportTicket();