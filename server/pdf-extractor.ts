import fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Initialize PDF.js worker
async function initializeWorker() {
  try {
    // Use a reliable path for the PDF.js worker
    // First, try to use a local file if available
    const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.js');
    
    if (fs.existsSync(workerPath)) {
      GlobalWorkerOptions.workerSrc = workerPath;
    } else {
      // Fallback to the CDN version
      GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      console.log(`Using CDN worker: ${GlobalWorkerOptions.workerSrc}`);
    }
  } catch (error) {
    console.error('Error initializing PDF.js worker:', error);
    throw new Error('Failed to initialize PDF worker');
  }
}

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
    // Initialize the worker if needed
    await initializeWorker();
    
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
    
    // Read the file
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: fileBuffer });
    const pdfDocument = await loadingTask.promise;
    
    // Extract text from each page
    let extractedText = '';
    const numPages = pdfDocument.numPages;
    
    // Limit to a reasonable number of pages to prevent issues with very large documents
    const pagesToProcess = Math.min(numPages, maxPages);
    
    for (let i = 1; i <= pagesToProcess; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n\n';
    }
    
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