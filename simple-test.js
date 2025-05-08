// Simple test script that doesn't rely on imports
// Uses the frontend API endpoint directly

import fetch from 'node-fetch';

async function testGenerateCoverLetter() {
  console.log('Testing cover letter generation with user profile...');
  
  try {
    // Direct API call to the cover letter endpoint
    const response = await fetch('http://localhost:3000/api/cover-letters/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: 'Marketing Specialist',
        companyName: 'Acme Corporation',
        jobDescription: `
        We're looking for a Marketing Specialist with 3+ years of experience.
        Responsibilities include creating marketing materials, managing campaigns,
        and analyzing results. Must have strong communication skills and experience
        with digital marketing platforms.
        `,
        // The userProfile should come from the session on server-side
      })
    });
    
    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const coverLetter = await response.text();
    
    // Check for placeholders
    const placeholders = [
      '[Your First Name]',
      '[Your Last Name]',
      '[Your Email]',
      '[Your Phone Number]',
      '[Your Location]'
    ];
    
    const containsPlaceholders = placeholders.some(placeholder => 
      coverLetter.includes(placeholder)
    );
    
    console.log('----- COVER LETTER TEST RESULTS -----');
    console.log('Successfully generated cover letter:', response.ok);
    console.log('Contains placeholders:', containsPlaceholders);
    
    // Show first 10 lines of the cover letter
    const lines = coverLetter.split('\n').slice(0, 10);
    console.log('\nFirst few lines:');
    console.log(lines.join('\n'));
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

testGenerateCoverLetter();