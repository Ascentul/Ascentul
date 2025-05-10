/**
 * Test script for support ticket API endpoints
 * Tests both anonymous and authenticated endpoints
 */

import fetch from 'node-fetch';

// Base URL for API endpoints
const BASE_URL = 'http://localhost:3000';
let authCookie = null;

// Test the anonymous support ticket endpoint
async function testAnonymousSupportEndpoint() {
  console.log('\n========== TESTING ANONYMOUS SUPPORT ENDPOINT ==========');
  
  try {
    // Create test data for anonymous support ticket
    const testTicketData = {
      userEmail: 'anonymous_test@example.com',
      userName: 'Anonymous Test User',
      subject: 'Anonymous Support Test',
      issueType: 'general',
      description: 'This is a test support ticket from an anonymous user.',
      priority: 'medium'
    };
    
    console.log('Submitting anonymous support ticket...');
    
    // Send POST request to the anonymous endpoint
    const response = await fetch(`${BASE_URL}/api/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testTicketData)
    });
    
    // Check response status
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Ticket created successfully!');
      console.log('Ticket ID:', data.id);
      return data.id;
    } else {
      const errorText = await response.text();
      console.error('Failed to create ticket:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Error submitting anonymous ticket:', error);
    return null;
  }
}

// Login to get authentication cookie
async function login(username, password) {
  console.log('\n========== LOGGING IN FOR AUTHENTICATED TESTS ==========');
  
  try {
    // Send login request
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      redirect: 'manual'
    });
    
    // Extract session cookie
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
      const sessionCookie = cookies.split(';')[0];
      console.log('Authentication successful, session cookie obtained');
      return sessionCookie;
    } else {
      console.error('No session cookie found in response');
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Test the authenticated university admin support endpoint
async function testUniversityAdminSupportEndpoint(cookie) {
  console.log('\n========== TESTING UNIVERSITY ADMIN SUPPORT ENDPOINT ==========');
  
  if (!cookie) {
    console.error('No authentication cookie available, skipping test');
    return null;
  }
  
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
    
    // Send POST request to the authenticated endpoint
    const response = await fetch(`${BASE_URL}/api/in-app/support`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify(testTicketData)
    });
    
    // Check response status
    console.log(`Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('University admin ticket created successfully!');
      console.log('Ticket ID:', data.id);
      return data.id;
    } else {
      const errorText = await response.text();
      console.error('Failed to create university admin ticket:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Error submitting university admin ticket:', error);
    return null;
  }
}

// Main test function
async function runTests() {
  try {
    console.log('========== SUPPORT TICKET API ENDPOINT TESTS ==========');
    
    // Test 1: Anonymous support endpoint
    const anonymousTicketId = await testAnonymousSupportEndpoint();
    
    // Test 2: Login with university admin credentials
    const cookie = await login('university_admin', 'password123');
    
    // Test 3: University admin support endpoint
    if (cookie) {
      const universityTicketId = await testUniversityAdminSupportEndpoint(cookie);
    }
    
    console.log('\n========== ALL TESTS COMPLETED ==========');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
await runTests();