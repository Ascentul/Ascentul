import { Request, Response, Router } from 'express';
import type { Express } from 'express';
import { requireAuth } from './auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create necessary directories
const ensureDirectoriesExist = () => {
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
  
  return resumesDir;
};

// Ensure directories exist at startup
const resumesDir = ensureDirectoriesExist();

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resumesDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with UUID and user ID if available
    const userId = req.user?.id || 'unknown';
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    cb(null, `resume_${userId}_${uniqueId}${ext}`);
  }
});

// Set up file upload middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check accepted file types - only PDF for now for reliability
    const fileTypes = /pdf/;
    const mimeTypes = /application\/pdf/;
    
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimeTypes.test(file.mimetype);
    
    console.log(`File upload check: ${file.originalname}, mimetype: ${file.mimetype}, extension: ${path.extname(file.originalname)}`);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file format! Only PDF files are allowed for reliable text extraction.'));
    }
  }
});

/**
 * Registers the updated resume-extract text endpoint with PDF parsing capabilities
 * @param app Express application or router
 */
export function registerPdfExtractRoutes(app: Router) {
  // Simple test endpoint to verify the route works
  app.get("/api/resumes/test", (req: Request, res: Response) => {
    res.json({ message: "PDF extraction route is working properly" });
  });
  
  // Direct file submission endpoint - processes file immediately
  app.post("/api/resumes/extract", requireAuth, (req: Request, res: Response) => {
    console.log("Starting direct PDF extraction process");
    console.log(`User ID: ${req.user?.id}, Content-Type: ${req.headers['content-type']}`);
    
    // Add more detailed debugging
    console.log("Request headers:", req.headers);
    console.log("Request body length:", req.body ? Object.keys(req.body).length : 'undefined');
    
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      console.error("Invalid content type for direct file extraction");
      return res.status(400).json({
        success: false,
        message: "Invalid content type. Direct extraction requires multipart/form-data."
      });
    }
    
    // Handle the file upload with multer
    const uploadHandler = upload.single('file');
    
    uploadHandler(req, res, async function(err) {
      if (err) {
        console.error("File upload error during direct extraction:", err);
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file for extraction"
        });
      }
      
      // Check if file was provided
      if (!req.file) {
        console.error("No file provided for direct extraction");
        return res.status(400).json({
          success: false,
          message: "No file provided for extraction"
        });
      }
      
      console.log(`File received for direct extraction: ${req.file.originalname} (${req.file.size} bytes)`);
      
      try {
        // Import the simple PDF extractor module
        const { simplePdfExtract } = await import('./simple-pdf');
        
        // Extract text from the uploaded file
        const filePath = req.file.path;
        const { text, pages } = await simplePdfExtract(filePath);
        
        console.log(`Successfully extracted text from ${req.file.originalname}: ${text.substring(0, 100)}...`);
        
        // Return the extracted text and file info
        return res.json({
          success: true,
          text: text,
          fileName: req.file.originalname,
          pages: pages,
          message: "Text successfully extracted from PDF"
        });
      } catch (extractError) {
        console.error("Error extracting text:", extractError);
        return res.status(500).json({
          success: false,
          message: "Error extracting text from the PDF",
          error: extractError instanceof Error ? extractError.message : 'Unknown error'
        });
      }
    });
  });

  // Legacy endpoints for backward compatibility
  // Resume file upload endpoint 
  app.post("/api/resumes/upload", requireAuth, (req: Request, res: Response) => {
    console.log(`Legacy upload endpoint called by user ID: ${req.user?.id}`);
    
    // Handle file upload with multer
    upload.single('file')(req, res, function (err) {
      if (err) {
        console.error("Legacy file upload error:", err);
        return res.status(400).json({ 
          success: false, 
          message: err.message || "Error uploading file",
        });
      }
      
      // Check if file was provided
      if (!req.file) {
        console.error("No file data provided in the legacy upload request");
        return res.status(400).json({ 
          success: false, 
          message: "No file data provided. Make sure you're selecting a file and using the 'file' field name.",
        });
      }
      
      console.log(`Legacy file upload successful: ${req.file.originalname} (${req.file.size} bytes)`);
      
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
  
  // Legacy text extraction endpoint  
  app.post("/api/resumes/extract-text", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Legacy extract-text endpoint called");
      // Import the simple PDF extractor module
      const { simplePdfExtract } = await import('./simple-pdf');
      
      // Check if we're receiving a file path or direct text
      const { filePath, text } = req.body;
      console.log(`Extract text request with filePath: ${filePath ? 'yes' : 'no'}, text: ${text ? 'yes' : 'no'}`);
      
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
        const { text: extractedText, pages } = await simplePdfExtract(filePath);
        
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