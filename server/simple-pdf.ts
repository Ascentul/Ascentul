import fs from 'fs';
import path from 'path';
// @ts-ignore - pdf-parse-fork doesn't have type definitions
import pdfParse from 'pdf-parse-fork';

/**
 * Simple interface for PDF extraction result
 */
interface PdfExtractionResult {
  text: string;
  pages: {
    processed: number;
    total: number;
  };
}

/**
 * Extract text from a PDF file using pdf-parse-fork
 * This is a very simple implementation to avoid Node.js/browser compatibility issues
 * 
 * @param filePath Path to the PDF file
 * @returns Promise<PdfExtractionResult> - Extracted text and page information
 */
export async function simplePdfExtract(
  filePath: string
): Promise<PdfExtractionResult> {
  try {
    console.log(`Starting simple PDF extraction from: ${filePath}`);
    
    // Validate the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read the file 
    const dataBuffer = fs.readFileSync(filePath);
    console.log(`Read PDF file: ${filePath}, size: ${dataBuffer.length} bytes`);
    
    // Parse the PDF
    // pdf-parse-fork is a modified version that works better in Node.js
    const data = await pdfParse(dataBuffer);
    
    // Return the extracted text
    console.log(`PDF processed, got ${data.text.length} characters of text`);
    
    return {
      text: data.text,
      pages: {
        processed: data.numpages,
        total: data.numpages
      }
    };
  } catch (error) {
    console.error(`Error extracting text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}