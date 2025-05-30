import express, { Request, Response, Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

/**
 * This router contains debugging routes for the PDF upload functionality
 */
const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
const resumesDir = path.join(uploadsDir, 'resumes');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Configure multer storage for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, resumesDir);
  },
  filename: function(req, file, cb) {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `debug-${uniqueId}${ext}`);
  }
});

// Create multer upload middleware with detailed error handling
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: function(req, file, cb) {
    console.log("Debug multer fileFilter called with:", file);
    
    // Check MIME type
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    
    cb(null, true);
  }
}).single('file');

// Debug page for testing uploads
router.get("/upload-test", (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'server/public/test-upload.html'));
});

// Simple upload endpoint that just saves the file and returns its details
router.post("/upload", (req: Request, res: Response) => {
  console.log("Debug upload endpoint called with request headers:", req.headers);
  
  upload(req, res, function(err) {
    if (err) {
      console.error("Debug upload error:", err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || "Upload failed"
      });
    }
    
    console.log("Debug upload request file:", req.file);
    
    // Check if file was uploaded
    if (!req.file) {
      console.error("Debug upload - no file received in request");
      return res.status(400).json({ 
        success: false, 
        message: "No file provided",
        requestBody: req.body
      });
    }
    
    // Return success with file details
    res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
  });
});

// Special test endpoint for PDF text extraction (no auth required)
router.post("/extract-pdf", (req: Request, res: Response) => {
  console.log("Debug PDF extraction endpoint called");
  
  upload(req, res, async function(err) {
    if (err) {
      console.error("Debug PDF extraction error:", err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || "Upload failed"
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      console.error("Debug PDF extraction - no file received");
      return res.status(400).json({ 
        success: false, 
        message: "No file provided"
      });
    }
    
    console.log(`PDF file received for extraction: ${req.file.originalname} (${req.file.size} bytes)`);
    
    try {
      // Import the PDF extractor module
      const { extractTextFromPdf } = await import('../pdf-extractor');
      
      // Extract text from the uploaded file
      const filePath = req.file.path;
      console.log(`Starting text extraction from ${filePath}`);
      
      const { text, pages } = await extractTextFromPdf(filePath);
      
      console.log(`Successfully extracted text from PDF (${pages.processed}/${pages.total} pages)`);
      
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

export default router;