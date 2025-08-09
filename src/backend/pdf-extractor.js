import fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist';
/**
 * Extract text from a PDF file
 * @param filePath Path to the PDF file, can be absolute or relative to CWD
 * @param maxPages Maximum number of pages to process (default: 20)
 * @returns Object with extracted text and page information
 */
export async function extractTextFromPdf(filePath, maxPages = 20) {
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
        // Read the file as a Uint8Array
        const fileBuffer = new Uint8Array(fs.readFileSync(fullPath));
        console.log(`Read PDF file: ${fullPath} (${fileBuffer.length} bytes)`);
        // Get PDF document from data
        const pdf = await pdfjs.getDocument({ data: fileBuffer }).promise;
        const numPages = pdf.numPages;
        console.log(`PDF has ${numPages} pages`);
        // Process pages (limit to maxPages)
        const pagesToProcess = Math.min(numPages, maxPages);
        let extractedText = '';
        for (let i = 1; i <= pagesToProcess; i++) {
            console.log(`Processing page ${i}/${pagesToProcess}`);
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // Extract text items
            const pageText = content.items
                .map((item) => item.str)
                .join(' ');
            extractedText += pageText + '\n\n';
        }
        // Add notice if we limited the number of pages
        if (numPages > maxPages) {
            extractedText += `\n\n[Note: Only the first ${maxPages} pages were processed. The document has ${numPages} pages in total.]`;
        }
        return {
            text: extractedText,
            pages: {
                processed: pagesToProcess,
                total: numPages
            }
        };
    }
    catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
}
