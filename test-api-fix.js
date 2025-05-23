// Test script to verify the /api/users/me endpoint fix
const fetch = require('node-fetch');

async function testUserEndpoint() {
  try {
    console.log('Testing /api/users/me endpoint...');
    
    const response = await fetch('http://localhost:3000/api/users/me');
    const userData = await response.json();
    
    console.log('Response status:', response.status);
    console.log('User data:', JSON.stringify(userData, null, 2));
    
    // Check for required fields
    const requiredFields = [
      'id', 'email', 'name', 'username', 
      'needsUsername', 'onboardingCompleted', 
      'userType', 'role', 'isUniversityStudent'
    ];
    
    const missingFields = requiredFields.filter(field => !(field in userData));
    
    if (missingFields.length === 0) {
      console.log('✅ All required fields are present');
      
      // Check specific values that prevent onboarding redirect
      if (userData.needsUsername === false && userData.onboardingCompleted === true) {
        console.log('✅ User should NOT be redirected to onboarding');
      } else {
        console.log('❌ User WILL be redirected to onboarding');
        console.log('  needsUsername:', userData.needsUsername);
        console.log('  onboardingCompleted:', userData.onboardingCompleted);
      }
    } else {
      console.log('❌ Missing required fields:', missingFields);
    }
    
  } catch (error) {
    console.error('Error testing endpoint:', error.message);
  }
}

testUserEndpoint(); 