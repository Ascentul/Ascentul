import fs from 'fs';
import path from 'path';
// Import the node build - this is critical for Node.js environment
// @ts-ignore - Ignore TypeScript errors for the legacy build import
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Tell pdfjs not to use or look for a worker - we're in Node.js not a browser
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

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
    
    // Read the file as a binary buffer
    const fileBuffer = new Uint8Array(fs.readFileSync(fullPath));
    
    // Load the PDF document using the legacy Node.js compatible build
    const pdfDocument = await pdfjsLib.getDocument({
      data: fileBuffer,
      // Disable worker to ensure compatibility with Node.js
      // This is critical for server-side PDF processing
      disableWorker: true
    }).promise;
    
    console.log(`PDF loaded successfully with ${pdfDocument.numPages} pages`);
    
    // Extract text from each page
    let extractedText = '';
    const numPages = pdfDocument.numPages;
    
    // Limit to a reasonable number of pages to prevent issues with very large documents
    const pagesToProcess = Math.min(numPages, maxPages);
    
    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      
      // Join all text items with spaces
      const pageText = textContent.items
        .filter((item: any) => item.str !== undefined && item.str !== null)
        .map((item: any) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n\n';
      console.log(`Processed page ${i}/${pagesToProcess}`);
    }
    
    // Add notice if we limited the number of pages
    if (numPages > pagesToProcess) {
      extractedText += `\n\n[Note: Only the first ${pagesToProcess} pages were processed. The document has ${numPages} pages in total.]`;
    }
    
    return {
      text: extractedText,
      pages: {
        processed: pagesToProcess,
        total: numPages
      }
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}