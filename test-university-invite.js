/**
 * Test script for university invitation email functionality
 * 
 * This script:
 * 1. Logs in as an admin user
 * 2. Creates a university invite
 * 3. Confirms that the email is sent
 */

import { execSync } from 'child_process';

// Helper to execute a curl command that properly handles cookies
function curlCommand(method, url, data = null, useCookieJar = true) {
  const cookieJar = 'cookie.txt';
  let cmd = `curl -s -X ${method} ${url}`;
  
  if (useCookieJar) {
    cmd += ` -c ${cookieJar} -b ${cookieJar}`;
  }
  
  cmd += ' -H "Content-Type: application/json"';
  
  if (data) {
    cmd += ` -d '${JSON.stringify(data)}'`;
  }
  
  return execSync(cmd).toString();
}

async function testUniversityInvite() {
  try {
    // Step 1: Login as an admin using curl (which handles cookies better)
    console.log('Logging in as admin...');
    
    // First, let's use curl to login which will preserve the cookie
    const loginResult = curlCommand('POST', 'http://localhost:3000/api/login', {
      username: 'admin',
      password: 'password123'
    });
    
    try {
      const loginData = JSON.parse(loginResult);
      console.log('Login successful!', loginData);
    } catch (err) {
      console.error('Login response was not valid JSON:', loginResult);
      return;
    }
    
    const emailAddress = `test${Date.now()}@example.com`;
    
    // Step 2: Create a university invite using curl with the same cookie jar
    console.log(`Creating invite for ${emailAddress}...`);
    const inviteResult = curlCommand('POST', 'http://localhost:3000/api/university-invites', {
      email: emailAddress,
      universityId: 1,
      role: 'admin'
    });
    
    try {
      const inviteData = JSON.parse(inviteResult);
      console.log('Invite response:', JSON.stringify(inviteData, null, 2));
      
      if (inviteData.success) {
        console.log(`Successfully created invite for ${emailAddress}`);
        console.log('Check the server logs to confirm the email was sent');
      } else {
        console.error('Failed to create invite:', inviteData);
      }
    } catch (err) {
      console.error('Invite response was not valid JSON:', inviteResult);
    }
  } catch (error) {
    console.error('Error in test script:', error);
  }
}

testUniversityInvite();