/**
 * Test script for generating a cover letter with user profile info
 * Run with: node test-cover-letter.js
 */

import { generateCoverLetter } from './server/openai.js';
import { config } from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
config();

// Initialize OpenAI for the test
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

global.openai = openai;

async function testCoverLetterGeneration() {
  console.log('Testing cover letter generation with user profile info...');
  
  try {
    // Test with a mock user profile
    const userProfile = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA'
    };
    
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
    
    // Call the OpenAI function directly
    const coverLetter = await generateCoverLetter(
      jobTitle,
      companyName,
      jobDescription,
      userProfile,
      userProfile.name
    );
    
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

// Add this for ES modules
export {};