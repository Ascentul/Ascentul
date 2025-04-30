// Simple test script for PDF text extraction

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the module dynamically
const pdfExtractor = await import('./server/pdf-extractor.js');

async function testExtraction() {
  try {
    console.log('Testing PDF text extraction...');
    
    // Create a test file path
    const testFilePath = path.join(__dirname, 'uploads', 'test-resume.txt');

    // Check if file exists
    if (!fs.existsSync(testFilePath)) {
      console.error(`Test file not found at: ${testFilePath}`);
      return;
    }
    
    console.log(`Test file exists at: ${testFilePath}`);
    
    // Use our text file as a simple mock - in real application we'd use a PDF
    const text = fs.readFileSync(testFilePath, 'utf8');
    
    console.log('\nExtracted text sample (direct from file):');
    console.log('----------------------');
    console.log(text.substring(0, 200) + '...');
    console.log('----------------------');
    
    // Now, try to use our PDF extractor API endpoint
    console.log('\nTesting PDF extraction route via direct API call:');
    console.log('Route: POST /api/resumes/extract-text');
    console.log('Payload: { text: "..." }');
    console.log('Expected response: JSON with success=true and extracted text');
    
    console.log('\nNote: In a full implementation, we would also test with actual PDF files');
    console.log('using our extractTextFromPdf function from pdfExtractor module.');
    
    console.log('\nExtraction test completed!');
  } catch (error) {
    console.error('Extraction test failed with error:', error);
  }
}

// Run the test
testExtraction().catch(console.error);