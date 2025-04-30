import { Request, Response } from 'express';
import { requireAuth } from './auth';

/**
 * Registers the updated resume-extract text endpoint with PDF parsing capabilities
 * @param app Express application or router
 */
export function registerPdfExtractRoutes(app: any) {
  // Resume text extraction endpoint with PDF parsing capability
  app.post("/api/resumes/extract-text", requireAuth, async (req: Request, res: Response) => {
    try {
      // Import the PDF extractor module
      const { extractTextFromPdf } = await import('./pdf-extractor');
      
      // Check if we're receiving a file path or direct text
      const { filePath, text } = req.body;
      
      // If direct text is provided, return it as is
      if (text) {
        return res.json({ 
          success: true, 
          text: text,
          message: "Text extracted successfully" 
        });
      }
      
      // If no file path is provided, return an error
      if (!filePath) {
        return res.status(400).json({ message: "No file path or text provided" });
      }
      
      try {
        // Extract text from the PDF file
        const { text: extractedText, pages } = await extractTextFromPdf(filePath);
        
        // Return the extracted text
        return res.json({ 
          success: true, 
          text: extractedText,
          message: "Text extracted successfully from PDF",
          pages
        });
      } catch (extractError) {
        console.error("PDF extraction error:", extractError);
        return res.status(400).json({ 
          message: "Error extracting text from PDF", 
          error: extractError instanceof Error ? extractError.message : 'Unknown error' 
        });
      }
    } catch (error) {
      console.error("Error in extract-text endpoint:", error);
      res.status(500).json({ 
        message: "Error processing request", 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}