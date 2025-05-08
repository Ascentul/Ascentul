/**
 * Test script for generating a cover letter with user profile info
 * Run with: node test-cover-letter.js
 */

import fetch from 'node-fetch';

async function testCoverLetterGeneration() {
  console.log('Testing cover letter generation with user profile data...');
  
  try {
    const response = await fetch('http://localhost:3000/api/cover-letters/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        jobTitle: 'Software Engineer',
        companyName: 'Tech Innovations Inc.',
        jobDescription: `
        We're seeking a talented Software Engineer to join our team.
        
        Requirements:
        - 3+ years experience in JavaScript and React
        - Experience with Node.js and Express
        - Understanding of database design and SQL
        - Strong problem-solving skills
        - Team player with excellent communication skills
        
        Responsibilities:
        - Develop and maintain web applications
        - Collaborate with cross-functional teams
        - Write clean, maintainable code
        - Participate in code reviews
        - Troubleshoot and debug applications
        `,
      }),
    });

    if (!response.ok) {
      console.error(`Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }

    const data = await response.text();
    
    // Check if the cover letter contains placeholder text
    const containsPlaceholders = 
      data.includes('[Your First Name]') || 
      data.includes('[Your Last Name]') ||
      data.includes('[Your Email]') ||
      data.includes('[Your Phone Number]');
    
    console.log('Cover letter generated successfully!');
    console.log('Contains placeholders:', containsPlaceholders);
    
    // Print just the first few lines to check header format
    const lines = data.split('\n').slice(0, 10);
    console.log('\nFirst few lines of the cover letter:');
    console.log(lines.join('\n'));
    
  } catch (error) {
    console.error('Error testing cover letter generation:', error);
  }
}

testCoverLetterGeneration();

// Add this for ES modules
export {};