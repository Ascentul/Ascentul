import { Request, Response } from 'express';
import { requireAuth } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Set up file upload middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check accepted file types
    const fileTypes = /pdf|doc|docx/;
    const mimeTypes = /application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document/;
    
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimeTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Invalid file format! Only PDF, DOC, or DOCX files are allowed.'));
    }
  }
});

/**
 * Registers the updated resume-extract text endpoint with PDF parsing capabilities
 * @param app Express application or router
 */
export function registerPdfExtractRoutes(app: any) {
  // Resume file upload endpoint
  app.post("/api/resumes/upload", requireAuth, (req: Request, res: Response) => {
    // Handle file upload with multer
    upload.single('file')(req, res, function (err) {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({ 
          success: false, 
          message: err.message || "Error uploading file",
        });
      }
      
      // Check if file was provided
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file data provided",
        });
      }
      
      // File uploaded successfully, return the path
      return res.json({
        success: true,
        message: "File uploaded successfully",
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileType: req.file.mimetype
      });
    });
  });
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