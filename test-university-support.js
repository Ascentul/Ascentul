/**
 * Test script for university support ticket submission
 * 
 * This script tests the authenticated support ticket endpoint
 * used by university administrators.
 * 
 * It uses cookie-based authentication to submit a test support ticket.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Helper function to run curl commands with authentication
function curlCommand(method, url, data = null, useCookieJar = true) {
  const cookieOptions = useCookieJar ? `-b cookie.txt -c cookie.txt` : '';
  const dataOption = data ? `-d '${JSON.stringify(data)}'` : '';
  
  return `curl -X ${method} ${cookieOptions} -H "Content-Type: application/json" ${dataOption} -v "${url}"`;
}

async function testUniversitySupportTicket() {
  try {
    console.log('========== UNIVERSITY ADMIN SUPPORT TICKET TEST ==========');
    
    // Step 1: Log in as admin - we'll use the superadmin account for testing
    console.log('\n1. Logging in as admin...');
    const loginCommand = curlCommand('POST', 'http://localhost:3000/api/login', {
      username: 'superadmin_022694',
      password: 'admin123'
    });
    
    console.log('Login command:', loginCommand);
    const loginOutput = execSync(loginCommand).toString();
    console.log('Login response:', loginOutput);
    
    // Step 2: Submit a university support ticket
    console.log('\n2. Submitting a university support ticket...');
    const supportTicket = {
      subject: 'Test University Support Ticket',
      issueType: 'account_access',
      description: 'This is a test support ticket for university administrators.',
      priority: 'medium',
      source: 'university-admin',
      department: 'Computer Science Department',
      contactPerson: 'Prof. Test Administrator'
    };
    
    const submitCommand = curlCommand('POST', 'http://localhost:3000/api/in-app/support', supportTicket);
    console.log('Submit command:', submitCommand);
    
    try {
      const submitOutput = execSync(submitCommand).toString();
      console.log('Submit response:', submitOutput);
      
      // Parse the response to get the ticket ID
      const ticket = JSON.parse(submitOutput);
      console.log('Support ticket created successfully:', ticket);
      
      // Step 3: Verify the ticket exists in the admin view
      if (ticket.id) {
        console.log(`\n3. Verifying ticket #${ticket.id} exists in admin view...`);
        const getTicketCommand = curlCommand('GET', `http://localhost:3000/api/admin/support-tickets/${ticket.id}`);
        const getTicketOutput = execSync(getTicketCommand).toString();
        console.log('Ticket details:', getTicketOutput);
      }
      
    } catch (error) {
      console.error('Error submitting support ticket:', error.message);
      console.error('Command output:', error.stdout?.toString());
      console.error('Command stderr:', error.stderr?.toString());
    }
    
    // Step 4: Get all university-specific tickets
    console.log('\n4. Fetching all university-admin tickets...');
    const getTicketsCommand = curlCommand('GET', 'http://localhost:3000/api/admin/support-tickets?source=university-admin');
    
    try {
      const getTicketsOutput = execSync(getTicketsCommand).toString();
      console.log('University tickets response length:', getTicketsOutput.length);
      const tickets = JSON.parse(getTicketsOutput);
      console.log(`Found ${tickets.length} university admin tickets`);
      
      // Show brief summary of each ticket
      if (tickets.length > 0) {
        console.log('\nTicket Summary:');
        tickets.forEach(ticket => {
          console.log(`- #${ticket.id}: ${ticket.subject} (${ticket.status}) - ${ticket.department || 'No department'}`);
        });
      }
    } catch (error) {
      console.error('Error fetching university tickets:', error.message);
    }
    
    console.log('\n========== TEST COMPLETED ==========');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test function
await testUniversitySupportTicket();