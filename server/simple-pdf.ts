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
      console.error(`File does not exist at path: ${filePath}`);
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Check file stats to validate size and access
    let stats;
    try {
      stats = fs.statSync(filePath);
      console.log(`File stats: size=${stats.size} bytes, isFile=${stats.isFile()}, created=${stats.birthtime}`);
      
      if (stats.size === 0) {
        console.error('File exists but is empty (0 bytes)');
        throw new Error('PDF file is empty (0 bytes)');
      }
    } catch (statError) {
      console.error(`Error checking file stats: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
      throw new Error(`Error accessing file: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
    }
    
    // Read the file into buffer
    let dataBuffer;
    try {
      dataBuffer = fs.readFileSync(filePath);
      console.log(`Read PDF file: ${filePath}, buffer size: ${dataBuffer.length} bytes`);
      
      if (dataBuffer.length === 0) {
        console.error('File read successfully but buffer is empty');
        throw new Error('PDF file buffer is empty');
      }
    } catch (readError) {
      console.error(`Error reading file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
      throw new Error(`Error reading PDF file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
    }
    
    // Parse the PDF using pdf-parse-fork
    try {
      console.log('Starting PDF parsing with pdf-parse-fork...');
      const data = await pdfParse(dataBuffer);
      
      // Check if we got any text back
      if (!data.text || data.text.trim().length === 0) {
        console.error('PDF parsed but no text was extracted');
        throw new Error('No text content found in PDF');
      }
      
      // Return the extracted text
      console.log(`PDF processed successfully, got ${data.text.length} characters of text`);
      
      return {
        text: data.text,
        pages: {
          processed: data.numpages,
          total: data.numpages
        }
      };
    } catch (parseError) {
      console.error(`Error parsing PDF: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      throw new Error(`Failed to parse PDF: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Error extracting text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}