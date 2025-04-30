const fs = require('fs');
const path = require('path');
const { extractTextFromPdf } = require('./server/pdf-extractor');

async function testExtraction() {
  try {
    console.log('Starting PDF text extraction test...');
    
    // Test direct text extraction
    const filePath = path.join(process.cwd(), 'uploads', 'test-resume.pdf');
    
    if (!fs.existsSync(filePath)) {
      console.log(`PDF file doesn't exist at ${filePath}. Please create a test PDF file first.`);
      return;
    }
    
    console.log(`Extracting text from: ${filePath}`);
    
    // Extract text from the PDF
    const result = await extractTextFromPdf(filePath);
    
    console.log('Text extraction successful!');
    console.log(`Pages processed: ${result.pages.processed} out of ${result.pages.total}`);
    console.log('\nExtracted text:\n' + '-'.repeat(40));
    console.log(result.text.substring(0, 500) + '...');
    console.log('-'.repeat(40));
    
  } catch (error) {
    console.error('Error testing PDF extraction:', error);
  }
}

testExtraction();