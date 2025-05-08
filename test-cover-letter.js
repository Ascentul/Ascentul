/**
 * Test script for generating a cover letter with user profile info
 * Run with: node test-cover-letter.js
 */

// Using node-fetch to make HTTP requests
const fetch = require('node-fetch');

async function testCoverLetterGeneration() {
  console.log('Testing cover letter generation with user profile info...');
  
  try {
    const jobTitle = 'Software Engineer';
    const companyName = 'Tech Innovations Inc.';
    const jobDescription = `
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
    `;
    
    // Call the API endpoint to generate a cover letter
    const response = await fetch('http://localhost:3000/api/cover-letters/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle,
        companyName,
        jobDescription,
        type: 'complete'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const coverLetter = data.content;
    
    // Check if the cover letter contains placeholder text
    const containsPlaceholders = 
      coverLetter.includes('[Your First Name]') || 
      coverLetter.includes('[Your Last Name]') ||
      coverLetter.includes('[Your Email]') ||
      coverLetter.includes('[Your Phone Number]') ||
      coverLetter.includes('[Your Location]');
    
    console.log('Cover letter generated successfully!');
    console.log('Contains placeholders:', containsPlaceholders);
    
    // Print just the first few lines to check header format
    const lines = coverLetter.split('\n').slice(0, 10);
    console.log('\nFirst few lines of the cover letter:');
    console.log(lines.join('\n'));
    
  } catch (error) {
    console.error('Error testing cover letter generation:', error);
  }
}

testCoverLetterGeneration();