import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

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
 * Extract text from a PDF file using a very simple approach
 * This function helps avoid Node.js/browser compatibility issues with PDF.js
 * 
 * @param filePath Path to the PDF file
 * @param maxPages Maximum number of pages to process
 * @returns Extracted text and page information
 */
export async function extractTextFromPdf(
  filePath: string,
  maxPages: number = 20
): Promise<PdfExtractionResult> {
  try {
    console.log(`Starting PDF extraction for: ${filePath}`);
    
    // Validate the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Make sure it's a PDF file
    if (!filePath.toLowerCase().endsWith('.pdf')) {
      throw new Error(`Not a PDF file: ${filePath}`);
    }
    
    // Get the file size
    const stats = fs.statSync(filePath);
    console.log(`PDF file size: ${stats.size} bytes`);
    
    // Read a small amount of the file to verify it's a PDF
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    
    // Check PDF signature
    if (buffer.toString() !== '%PDF-') {
      throw new Error('Invalid PDF file format');
    }
    
    // Read the whole file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Count approximate number of pages
    // This is a rough estimate based on PDF structure markers
    const pdfContent = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 100000));
    const pageCountMatch = pdfContent.match(/\/Type\s*\/Page/g);
    const estimatedPages = pageCountMatch ? pageCountMatch.length : 1;
    console.log(`Estimated PDF pages: ${estimatedPages}`);
    
    // For this temporary solution, we'll extract text by converting each byte to its 
    // ASCII representation if it's a printable character
    let extractedText = '';
    
    // Process the buffer directly
    for (let i = 0; i < fileBuffer.length; i++) {
      const byte = fileBuffer[i];
      // Only include ASCII printable characters (32-126)
      if (byte >= 32 && byte <= 126) {
        extractedText += String.fromCharCode(byte);
      } else if (byte === 10 || byte === 13) {
        // Add newlines
        extractedText += '\n';
      }
    }
    
    // Clean up the extracted text
    // Remove sequences that are likely PDF syntax, not content
    extractedText = extractedText
      .replace(/endobj/g, '\n')
      .replace(/endstream/g, '\n')
      .replace(/obj/g, ' ')
      .replace(/stream/g, '\n')
      .replace(/xref/g, ' ')
      .replace(/trailer/g, ' ')
      .replace(/%[^\n]*/g, '')  // Remove PDF comments
      .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with a single space
      .replace(/\n{2,}/g, '\n\n');  // Replace multiple newlines with two newlines
    
    // Extract what seems to be text content by looking for longer sequences
    // of readable characters between PDF syntax elements
    const textBlocks = extractedText.match(/[a-zA-Z,\.\s;:'\-"]{10,}/g) || [];
    const cleanedText = textBlocks.join('\n\n');
    
    // Limit the text based on maxPages (very approximate)
    const averagePageSize = cleanedText.length / estimatedPages;
    const limitedText = cleanedText.substring(0, Math.min(cleanedText.length, averagePageSize * maxPages));
    
    return {
      text: limitedText,
      pages: {
        processed: Math.min(estimatedPages, maxPages),
        total: estimatedPages
      }
    };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}