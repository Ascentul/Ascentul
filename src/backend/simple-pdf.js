import fs from 'fs';
// @ts-ignore - pdf-parse-fork doesn't have type definitions
import pdfParse from 'pdf-parse-fork';
import { PDFDocument } from 'pdf-lib';
/**
 * Extract text from a PDF file using multiple libraries for robustness
 * Uses both pdf-lib for validation and pdf-parse-fork for text extraction
 * Falls back between methods if one fails
 *
 * @param filePath Path to the PDF file
 * @returns Promise<PdfExtractionResult> - Extracted text and page information
 */
export async function simplePdfExtract(filePath) {
    try {

        // Validate the file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File does not exist at path: ${filePath}`);
            throw new Error(`File not found: ${filePath}`);
        }
        // Check file stats to validate size and access
        let stats;
        try {
            stats = fs.statSync(filePath);

            if (stats.size === 0) {
                console.error('File exists but is empty (0 bytes)');
                throw new Error('PDF file is empty (0 bytes)');
            }
        }
        catch (statError) {
            console.error(`Error checking file stats: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
            throw new Error(`Error accessing file: ${statError instanceof Error ? statError.message : 'Unknown error'}`);
        }
        // Read the file into buffer
        let dataBuffer;
        try {
            dataBuffer = fs.readFileSync(filePath);

            if (dataBuffer.length === 0) {
                console.error('File read successfully but buffer is empty');
                throw new Error('PDF file buffer is empty');
            }
        }
        catch (readError) {
            console.error(`Error reading file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
            throw new Error(`Error reading PDF file: ${readError instanceof Error ? readError.message : 'Unknown error'}`);
        }
        // First validate the PDF structure with pdf-lib
        try {

            const pdfDoc = await PDFDocument.load(dataBuffer);
            const pageCount = pdfDoc.getPageCount();

            if (pageCount === 0) {
                console.error('PDF has 0 pages');
                throw new Error('PDF has no pages');
            }
        }
        catch (pdfLibError) {
            console.error(`Error validating PDF with pdf-lib: ${pdfLibError instanceof Error ? pdfLibError.message : 'Unknown error'}`);
            // Don't throw yet - we'll try pdf-parse-fork anyway

        }
        // Now try with pdf-parse-fork for text extraction
        try {

            const data = await pdfParse(dataBuffer);
            // Check if we got any text back
            if (!data.text || data.text.trim().length === 0) {

                throw new Error('No text content found in PDF with pdf-parse-fork');
            }
            // Return the extracted text

            return {
                text: data.text,
                pages: {
                    processed: data.numpages,
                    total: data.numpages
                }
            };
        }
        catch (parseError) {
            console.error(`Error parsing PDF with pdf-parse-fork: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            // Attempt one more extraction using a more lenient approach with pdf-lib
            try {

                const pdfDoc = await PDFDocument.load(dataBuffer, { ignoreEncryption: true });
                const pageCount = pdfDoc.getPageCount();
                // Since pdf-lib doesn't have direct text extraction, we'll create a minimal
                // placeholder result with information about the PDF structure
                const placeholderText = `PDF document with ${pageCount} pages. Text extraction failed with standard methods. Please try a different PDF file or check if the document contains extractable text content.`;

                return {
                    text: placeholderText,
                    pages: {
                        processed: pageCount,
                        total: pageCount
                    }
                };
            }
            catch (fallbackError) {
                console.error(`Final fallback extraction also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
                throw new Error(`Failed to extract text from PDF. All extraction methods failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            }
        }
    }
    catch (error) {
        console.error(`Error extracting text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}
