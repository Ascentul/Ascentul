import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

/**
 * Extract text from a PDF file
 * @param filePath Path to the PDF file, can be absolute or relative to CWD
 * @param maxPages Maximum number of pages to process (default: 20)
 * @returns Object with extracted text and page information
 */
export async function extractTextFromPdf(
  filePath: string, 
  maxPages: number = 20
): Promise<{ text: string; pages: { processed: number; total: number } }> {
  try {
    // Normalize the file path (remove leading slash if present)
    const normalizedPath = filePath.replace(/^\//, '');
    
    // Get the full path to the file
    const fullPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(process.cwd(), normalizedPath);
    
    // Check if the file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }
    
    // Check if the file is a PDF
    if (!fullPath.toLowerCase().endsWith('.pdf')) {
      throw new Error('Only PDF files are supported for text extraction');
    }
    
    // Read the file buffer
    const dataBuffer = fs.readFileSync(fullPath);
    console.log(`Read PDF file: ${fullPath} (${dataBuffer.length} bytes)`);
    
    // Parse the PDF using pdf-parse
    const options = {
      // Limit page rendering if specified
      max: maxPages
    };
    
    const result = await pdfParse(dataBuffer, options);
    
    console.log(`PDF processed successfully with ${result.numpages} pages`);
    
    // Format the extracted text
    let extractedText = result.text;
    
    // Add notice if we limited the number of pages
    if (result.numpages > maxPages) {
      extractedText += `\n\n[Note: Only the first ${maxPages} pages were processed. The document has ${result.numpages} pages in total.]`;
    }
    
    return {
      text: extractedText,
      pages: {
        processed: Math.min(result.numpages, maxPages),
        total: result.numpages
      }
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}