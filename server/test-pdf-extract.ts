import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Create a router for testing
const router = express.Router();

// Set up multer storage for test uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    cb(null, `test_pdf_${uniqueId}${ext}`);
  }
});

// Configure multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    // Accept PDF files only
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Test endpoint with raw file buffer handling
router.post('/test-pdf-extract', upload.single('file'), async (req, res) => {
  console.log("TEST ENDPOINT: PDF extraction test called");

  try {
    if (!req.file) {
      console.error("TEST ENDPOINT: No file uploaded");
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log(`TEST ENDPOINT: File received: ${req.file.originalname}, size: ${req.file.size} bytes`);

    // Try different PDF extraction methods
    try {
      // Method 1: Try pdf-parse-fork
      const pdfParse = await import('pdf-parse-fork')
        .then(module => module.default)
        .catch(err => {
          console.error("TEST ENDPOINT: Error importing pdf-parse-fork:", err);
          return null;
        });

      if (pdfParse) {
        try {
          console.log("TEST ENDPOINT: Trying extraction with pdf-parse-fork");
          const dataBuffer = fs.readFileSync(req.file.path);
          const result = await pdfParse(dataBuffer);
          
          console.log(`TEST ENDPOINT: pdf-parse-fork extracted ${result.text.length} characters, ${result.numpages} pages`);
          
          return res.json({
            success: true,
            method: 'pdf-parse-fork',
            textLength: result.text.length,
            pages: result.numpages,
            textPreview: result.text.substring(0, 200),
            fileName: req.file.originalname
          });
        } catch (err) {
          console.error("TEST ENDPOINT: pdf-parse-fork extraction failed:", err);
        }
      }

      // Method 2: Try regular pdf-parse as fallback
      const pdfParseRegular = await import('pdf-parse')
        .then(module => module.default)
        .catch(err => {
          console.error("TEST ENDPOINT: Error importing regular pdf-parse:", err);
          return null;
        });

      if (pdfParseRegular) {
        try {
          console.log("TEST ENDPOINT: Trying extraction with regular pdf-parse");
          const dataBuffer = fs.readFileSync(req.file.path);
          const result = await pdfParseRegular(dataBuffer);
          
          console.log(`TEST ENDPOINT: regular pdf-parse extracted ${result.text.length} characters, ${result.numpages} pages`);
          
          return res.json({
            success: true,
            method: 'pdf-parse',
            textLength: result.text.length,
            pages: result.numpages,
            textPreview: result.text.substring(0, 200),
            fileName: req.file.originalname
          });
        } catch (err) {
          console.error("TEST ENDPOINT: regular pdf-parse extraction failed:", err);
        }
      }

      // No extraction method succeeded
      return res.status(500).json({
        success: false,
        message: 'All extraction methods failed'
      });
    } catch (extractionError) {
      console.error("TEST ENDPOINT: Extraction error:", extractionError);
      return res.status(500).json({
        success: false,
        message: 'Error during extraction',
        error: extractionError instanceof Error ? extractionError.message : 'Unknown error'
      });
    }
  } catch (error) {
    console.error("TEST ENDPOINT: General error:", error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Simple HTML form for testing
router.get('/test-pdf-upload-form', (_req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test PDF Upload</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        button { padding: 8px 15px; background: #1333c2; color: white; border: none; cursor: pointer; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto; max-height: 400px; }
      </style>
    </head>
    <body>
      <h1>PDF Extraction Test</h1>
      <p>Upload a PDF file to test extraction functionality</p>
      
      <form id="uploadForm" enctype="multipart/form-data">
        <div class="form-group">
          <label for="pdfFile">Select PDF:</label>
          <input type="file" id="pdfFile" name="file" accept="application/pdf" required>
        </div>
        <button type="submit">Test Extraction</button>
      </form>
      
      <div id="result" style="margin-top: 20px; display: none;">
        <h2>Result:</h2>
        <pre id="resultContent"></pre>
      </div>
      
      <script>
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData();
          const fileInput = document.getElementById('pdfFile');
          
          if (!fileInput.files.length) {
            alert('Please select a file');
            return;
          }
          
          formData.append('file', fileInput.files[0]);
          
          const resultDiv = document.getElementById('result');
          const resultContent = document.getElementById('resultContent');
          
          try {
            resultDiv.style.display = 'block';
            resultContent.textContent = 'Processing...';
            
            const response = await fetch('/test-pdf-extract', {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            resultContent.textContent = JSON.stringify(result, null, 2);
          } catch (error) {
            resultContent.textContent = 'Error: ' + error.message;
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

export default router;