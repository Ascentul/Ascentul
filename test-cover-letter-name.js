/**
 * Test script to verify correct name handling in cover letter generation
 * This script should be run to make sure the user's name is correctly used
 * throughout the cover letter without placeholder text like [Your Name]
 */

import { generateCoverLetter } from './server/openai.js';

async function testCoverLetterName() {
  try {
    console.log('Starting test for cover letter name handling...');

    // Test with full user profile
    const userProfile = {
      id: 123,
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '555-123-4567',
      location: 'New York, NY'
    };

    // Mock career data
    const careerData = {
      careerSummary: 'Experienced software developer with focus on web technologies.',
      workHistory: 'Software Engineer at Tech Co (2020-Present)',
      education: 'BS Computer Science, State University (2016-2020)',
      skills: ['JavaScript', 'React', 'Node.js'],
      certifications: 'AWS Certified Developer'
    };

    console.log('Generating cover letter with user profile name:', userProfile.name);
    
    const result = await generateCoverLetter(
      'Software Developer',
      'ABC Tech',
      'We are looking for a Software Developer with experience in JavaScript, React, and Node.js.',
      careerData,
      userProfile
    );

    console.log('\n--- GENERATED COVER LETTER ---\n');
    console.log(result);
    console.log('\n--- END OF COVER LETTER ---\n');

    // Check for name consistency
    if (result.includes('[Your')) {
      console.error('❌ ERROR: Cover letter contains placeholder text with [Your...]');
    } else {
      console.log('✅ SUCCESS: No placeholder text found in cover letter');
    }

    // Check that the user's name appears in the cover letter
    if (result.includes(userProfile.name)) {
      console.log(`✅ SUCCESS: User name "${userProfile.name}" is used in the cover letter`);
    } else {
      console.error(`❌ ERROR: User name "${userProfile.name}" not found in cover letter`);
    }

    // Check for absence of "Job Applicant" fallback in first few lines
    const firstFewLines = result.split('\n').slice(0, 10).join('\n');
    if (firstFewLines.includes('Job Applicant')) {
      console.error('❌ ERROR: Cover letter uses "Job Applicant" fallback despite having user name');
    } else {
      console.log('✅ SUCCESS: Cover letter does not use "Job Applicant" fallback text');
    }
  } catch (error) {
    console.error('Error testing cover letter name handling:', error);
  }
}

testCoverLetterName();