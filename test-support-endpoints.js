/**
 * Test script for support ticket API endpoints
 * Tests both anonymous and authenticated endpoints
 * 
 * This improved version handles API format correctly and uses proper error handling
 */

import fetch from 'node-fetch';
import { execSync } from 'child_process';

// Base URL for API endpoints
const BASE_URL = 'http://localhost:3000';

// Test the anonymous support ticket endpoint
async function testAnonymousSupportEndpoint() {
  console.log('\n========== TESTING ANONYMOUS SUPPORT ENDPOINT ==========');
  
  try {
    // Create test data for anonymous support ticket
    const testTicketData = {
      user_email: 'anonymous_test@example.com', // Note the snake_case format for API
      user_name: 'Anonymous Test User',
      subject: 'Anonymous Support Test',
      issue_type: 'general', // Note the snake_case format for API
      description: 'This is a test support ticket from an anonymous user.',
      attachment_url: null
    };
    
    console.log('Submitting anonymous support ticket...');
    
    // Use curl for more reliable testing with session handling
    const curlCommand = `curl -s -X POST ${BASE_URL}/api/support -H "Content-Type: application/json" -d '${JSON.stringify(testTicketData)}'`;
    console.log(`Executing: ${curlCommand}`);
    
    const response = execSync(curlCommand).toString();
    console.log('Response:', response);
    
    try {
      const data = JSON.parse(response);
      console.log('Ticket created successfully!');
      console.log('Ticket ID:', data.id);
      return data.id;
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.log('Raw response:', response.substring(0, 200) + '...');
      return null;
    }
  } catch (error) {
    console.error('Error submitting anonymous ticket:', error);
    return null;
  }
}

// Login using curl for reliable session cookie handling
function loginWithCurl(username, password) {
  console.log('\n========== LOGGING IN FOR AUTHENTICATED TESTS ==========');
  
  try {
    // Create login credentials
    const credentials = { username, password };
    
    // Use curl to log in and save cookies to a file
    const curlCommand = `curl -s -c cookie.txt -X POST ${BASE_URL}/api/login -H "Content-Type: application/json" -d '${JSON.stringify(credentials)}'`;
    console.log(`Executing login: ${curlCommand}`);
    
    const response = execSync(curlCommand).toString();
    console.log('Login response:', response.substring(0, 100) + '...');
    
    try {
      const data = JSON.parse(response);
      console.log('Login successful!');
      console.log('User ID:', data.id);
      console.log('User Type:', data.userType);
      console.log('Role:', data.role);
      
      // Check if the cookie file exists
      const checkCookie = execSync('cat cookie.txt | grep -i connect.sid').toString();
      console.log('Cookie found:', checkCookie ? 'Yes' : 'No');
      
      return true;
    } catch (parseError) {
      console.error('Failed to parse login response as JSON:', parseError);
      console.log('Raw response:', response.substring(0, 200) + '...');
      return false;
    }
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// Test the authenticated university admin support endpoint
function testUniversityAdminSupportEndpoint() {
  console.log('\n========== TESTING UNIVERSITY ADMIN SUPPORT ENDPOINT ==========');
  
  try {
    // Create test data for university admin support ticket
    const testTicketData = {
      subject: 'University Admin Support Test',
      issueType: 'technical',
      description: 'This is a test support ticket from a university admin user.',
      priority: 'high',
      department: 'Information Technology',
      contactPerson: 'IT Admin Person'
    };
    
    console.log('Submitting university admin support ticket...');
    
    // Use curl with the saved cookie file for authentication
    const curlCommand = `curl -s -b cookie.txt -X POST ${BASE_URL}/api/in-app/support -H "Content-Type: application/json" -d '${JSON.stringify(testTicketData)}'`;
    console.log(`Executing: ${curlCommand}`);
    
    const response = execSync(curlCommand).toString();
    console.log('Response:', response);
    
    try {
      const data = JSON.parse(response);
      console.log('University admin ticket created successfully!');
      console.log('Ticket ID:', data.id);
      
      // Verify the ticket details
      if (data.id) {
        console.log('\nVerifying ticket details...');
        const verifyCommand = `curl -s -b cookie.txt -X GET ${BASE_URL}/api/admin/support-tickets/${data.id}`;
        const verifyResponse = execSync(verifyCommand).toString();
        console.log('Verification response:', verifyResponse);
      }
      
      return data.id;
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      console.log('Raw response:', response.substring(0, 200) + '...');
      return null;
    }
  } catch (error) {
    console.error('Error submitting university admin ticket:', error);
    return null;
  }
}

// Function to view all university admin tickets
function viewUniversityAdminTickets() {
  console.log('\n========== VIEWING ALL UNIVERSITY ADMIN TICKETS ==========');
  
  try {
    // Use curl with the saved cookie file to get all tickets
    const curlCommand = `curl -s -b cookie.txt -X GET "${BASE_URL}/api/admin/support-tickets?source=university-admin"`;
    console.log(`Executing: ${curlCommand}`);
    
    const response = execSync(curlCommand).toString();
    
    try {
      const tickets = JSON.parse(response);
      console.log(`Found ${tickets.length} university admin tickets`);
      
      if (tickets.length > 0) {
        console.log('\nTicket Summary:');
        tickets.forEach(ticket => {
          console.log(`- #${ticket.id}: ${ticket.subject} (${ticket.status}) - ${ticket.department || 'No department'}`);
        });
      }
      
      return tickets.length;
    } catch (parseError) {
      console.error('Failed to parse tickets response as JSON:', parseError);
      console.log('Raw response:', response.substring(0, 200) + '...');
      return 0;
    }
  } catch (error) {
    console.error('Error viewing tickets:', error);
    return 0;
  }
}

// Main test function
function runTests() {
  try {
    console.log('========== SUPPORT TICKET API ENDPOINT TESTS ==========');
    
    // Test 1: Anonymous support endpoint
    const anonymousTicketId = testAnonymousSupportEndpoint();
    
    // Test 2: Login with university admin credentials
    const loginSuccess = loginWithCurl('superadmin_022694', 'admin123');
    
    // Test 3: University admin support endpoint
    if (loginSuccess) {
      const universityTicketId = testUniversityAdminSupportEndpoint();
      
      // Test 4: View all university admin tickets
      if (universityTicketId) {
        const ticketCount = viewUniversityAdminTickets();
      }
    }
    
    console.log('\n========== ALL TESTS COMPLETED ==========');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
runTests();