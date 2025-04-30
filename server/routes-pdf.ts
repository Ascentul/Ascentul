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
    
    // Create resumes subdirectory if it doesn't exist
    const resumesDir = path.join(uploadDir, 'resumes');
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }
    
    // Store files in the resumes directory
    cb(null, resumesDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with timestamp and user ID if available
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `resume_${userId}_${timestamp}${ext}`);
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
    // Log the authentication state to debug
    console.log(`Upload request from user ID: ${req.user?.id}`);
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Also ensure the resumes subdirectory exists
    const resumesDir = path.join(uploadDir, 'resumes');
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }
    
    // Log more details about the request
    console.log("Upload request headers:", req.headers);
    console.log("Request content type:", req.headers['content-type']);
    
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      console.error("Invalid content type for file upload");
      return res.status(400).json({
        success: false,
        message: "Invalid content type. File uploads require multipart/form-data."
      });
    }
    
    // Handle file upload with multer
    upload.single('file')(req, res, function (err) {
      if (err) {
        console.error("File upload error:", err);
        // If it's a multer error, send a more specific message
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: "File is too large. Maximum size is 5MB.",
          });
        } else if (err.message && err.message.includes('Invalid file format')) {
          return res.status(400).json({
            success: false,
            message: "Invalid file format. Only PDF, DOC, or DOCX files are allowed.",
          });
        } else {
          return res.status(400).json({ 
            success: false, 
            message: err.message || "Error uploading file",
          });
        }
      }
      
      // Check if file was provided
      if (!req.file) {
        console.error("No file data provided in the request");
        console.log("Request body:", req.body);
        console.log("Request files:", req.files);
        
        return res.status(400).json({ 
          success: false, 
          message: "No file data provided. Make sure you're using the 'file' field name when uploading.",
        });
      }
      
      console.log(`File uploaded successfully: ${req.file.originalname} (${req.file.size} bytes)`);
      
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