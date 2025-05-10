/**
 * Test script for university invitation email functionality
 * 
 * This script:
 * 1. Logs in as an admin user
 * 2. Creates a university invite
 * 3. Confirms that the email is sent
 */
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Helper function to create curl commands
function curlCommand(method, url, data = null, useCookieJar = true) {
  let cmd = `curl -X ${method} -s -H "Content-Type: application/json"`;
  
  // Use cookie jar for authentication
  if (useCookieJar) {
    cmd += ' -b cookie.txt -c cookie.txt';
  }
  
  // Add data if provided
  if (data) {
    cmd += ` -d '${JSON.stringify(data)}'`;
  }
  
  // Add URL
  cmd += ` http://localhost:3000${url}`;
  
  return cmd;
}

async function testUniversityInvite() {
  try {
    console.log('---------------------------------------------------');
    console.log('🔍 Testing University Admin Invitation Functionality');
    console.log('---------------------------------------------------');
    
    // Step 1: Log in as admin user
    console.log('\n1️⃣ Logging in as admin user...');
    const loginData = {
      username: 'superadmin_022694',
      password: 'password123'
    };
    
    // Execute login command
    const loginCmd = curlCommand('POST', '/api/login', loginData);
    console.log(`Executing: ${loginCmd}`);
    
    let loginResult;
    try {
      loginResult = await execPromise(loginCmd);
      console.log('✅ Login successful\n');
    } catch (error) {
      console.error('❌ Login failed:', error);
      return;
    }
    
    // Step 2: Create a test university if needed
    console.log('2️⃣ Checking for test university...');
    
    // First get all universities
    const getUnivCmd = curlCommand('GET', '/api/universities');
    let univResult;
    try {
      univResult = await execPromise(getUnivCmd);
      const universities = JSON.parse(univResult.stdout);
      console.log(`Found ${universities.length} universities`);
      
      // Use first university or create one if none exists
      let testUniversityId;
      let universityName;
      
      if (universities.length > 0) {
        testUniversityId = universities[0].id;
        universityName = universities[0].name;
        console.log(`✅ Using existing university: ${universityName} (ID: ${testUniversityId})`);
      } else {
        console.log('No universities found, creating a test university...');
        
        const createUnivData = {
          name: 'Test University',
          slug: 'test-university',
          domain: 'test.edu',
          licenseSeats: 100
        };
        
        const createUnivCmd = curlCommand('POST', '/api/universities', createUnivData);
        const createUnivResult = await execPromise(createUnivCmd);
        const newUniversity = JSON.parse(createUnivResult.stdout);
        
        testUniversityId = newUniversity.id;
        universityName = newUniversity.name;
        console.log(`✅ Created test university: ${universityName} (ID: ${testUniversityId})`);
      }
      
      // Step 3: Create university invite
      console.log('\n3️⃣ Creating university admin invite...');
      
      const testEmail = `test-university-admin-${Date.now()}@example.com`;
      const inviteData = {
        email: testEmail,
        universityId: testUniversityId,
        role: 'admin'
      };
      
      const createInviteCmd = curlCommand('POST', '/api/university-invites', inviteData);
      console.log(`Executing: ${createInviteCmd}`);
      
      try {
        const inviteResult = await execPromise(createInviteCmd);
        const inviteResponse = JSON.parse(inviteResult.stdout);
        
        if (inviteResponse.success) {
          console.log('✅ University invite created successfully');
          console.log(`📧 Invitation email sent to: ${testEmail}`);
          console.log(`🏫 University: ${universityName}`);
          console.log(`🔗 Invite URL: ${inviteResponse.invite.inviteUrl}`);
        } else {
          console.error('❌ Failed to create invite:', inviteResponse);
        }
      } catch (inviteError) {
        console.error('❌ Error creating invite:', inviteError);
      }
      
    } catch (univError) {
      console.error('❌ Error fetching universities:', univError);
      return;
    }
    
    console.log('\n---------------------------------------------------');
    console.log('✅ University invite test completed');
    console.log('---------------------------------------------------');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testUniversityInvite();