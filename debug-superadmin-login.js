// Helper script to log in as super admin and check redirect paths
// Run with Node.js:
// node debug-superadmin-login.js

const fetch = require('node-fetch');

async function testSuperAdminLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@dev.ascentul',
        password: 'admin123',  // Replace with the actual password
        loginType: 'admin'
      }),
    });

    const data = await response.json();
    
    console.log('Login Response:', {
      status: response.status,
      redirectPath: data.redirectPath,
      userRole: data.user?.role,
      userType: data.user?.userType
    });
    
    return data;
  } catch (error) {
    console.error('Error testing super admin login:', error);
  }
}

testSuperAdminLogin();