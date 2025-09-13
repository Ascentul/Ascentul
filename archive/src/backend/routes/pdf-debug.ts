import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Define the upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store uploads in a specific directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'debug');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to avoid collisions
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, `debug-${uniqueId}${fileExt}`);
  }
});

// Filter for PDF files
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {

  if (file.mimetype === 'application/pdf') {
    // Accept PDF files
    cb(null, true);
  } else {
    // Reject non-PDF files
    cb(new Error('Only PDF files are allowed'));
  }
};

// Configure multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Import our TypeScript PDF utility
import { extractTextFromPdf } from '../pdf-util';

// Separated PDF extraction function with robust error handling
async function extractText(filePath: string): Promise<string> {
  try {

    // Use our TypeScript PDF utility
    const result = await extractTextFromPdf(filePath, 10); // Limit to 10 pages for quicker debugging
    
    // Return formatted text with page info
    return `Successfully extracted text from ${path.basename(filePath)}\n` + 
           `Pages: ${result.pages.processed}/${result.pages.total}\n\n` +
           `Text Preview (first 500 chars):\n${result.text.substring(0, 500)}...`;
    
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    return `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
  }
}

// Register the debug routes
export function registerPdfDebugRoutes(router: Router) {
  // Test page that shows PDF upload form
  router.get('/debug/pdf-test', (req, res) => {
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PDF Text Extraction Debug</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .container { max-width: 800px; margin: 0 auto; }
          .section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 4px; }
          h1 { color: #333; }
          button, input[type="submit"] { background: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
          button:hover, input[type="submit"]:hover { background: #45a049; }
          textarea { width: 100%; height: 200px; margin-top: 10px; font-family: monospace; }
          .card { background: #f9f9f9; padding: 15px; margin-bottom: 10px; border-radius: 4px; }
          .success { border-left: 4px solid green; }
          .error { border-left: 4px solid red; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PDF Text Extraction Debug</h1>
          
          <div class="section">
            <h2>Test 1: Simple File Upload</h2>
            <form action="/debug/pdf-upload" method="post" enctype="multipart/form-data">
              <div>
                <input type="file" name="file" accept="application/pdf" required />
              </div>
              <div style="margin-top: 10px;">
                <input type="submit" value="Upload and Process PDF" />
              </div>
            </form>
          </div>
          
          <div class="section">
            <h2>Test 2: AJAX Upload with Response</h2>
            <div>
              <input type="file" id="pdfFile" accept="application/pdf" />
            </div>
            <div style="margin-top: 10px;">
              <button id="uploadBtn">Upload and Extract Text</button>
            </div>
            <div style="margin-top: 10px;">
              <h3>Extracted Text:</h3>
              <textarea id="extractedText" readonly></textarea>
            </div>
          </div>
          
          <div class="section">
            <h2>Log Output</h2>
            <div id="logOutput"></div>
          </div>
        </div>
        
        <script>
          function logMessage(message, isError = false) {
            const logOutput = document.getElementById('logOutput');
            const entry = document.createElement('div');
            entry.className = isError ? 'card error' : 'card success';
            entry.textContent = message;
            logOutput.prepend(entry);

          }
          
          document.getElementById('uploadBtn').addEventListener('click', function() {
            const fileInput = document.getElementById('pdfFile');
            const file = fileInput.files[0];
            
            if (!file) {
              logMessage('Please select a file first', true);
              return;
            }
            
            if (file.type !== 'application/pdf') {
              logMessage('Only PDF files are allowed', true);
              return;
            }
            
            logMessage('Starting upload: ' + file.name);
            
            const formData = new FormData();
            formData.append('file', file);
            
            fetch('/debug/pdf-upload', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                document.getElementById('extractedText').value = data.text;
                logMessage('Text extraction successful');
              } else {
                document.getElementById('extractedText').value = 'Error: ' + data.message;
                logMessage('Error: ' + data.message, true);
              }
            })
            .catch(error => {
              logMessage('Error: ' + error.message, true);
              document.getElementById('extractedText').value = 'Error: ' + error.message;
            });
          });
        </script>
      </body>
      </html>
    `;
    
    res.send(testHtml);
  });
  
  // PDF upload and basic extraction endpoint (simplified for debugging)
  router.post('/debug/pdf-upload', upload.single('file'), async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file was uploaded'
        });
      }

      // Use simplified extraction function
      const extractedText = await extractText(req.file.path);
      
      return res.json({
        success: true,
        text: extractedText,
        fileInfo: {
          originalName: req.file.originalname,
          size: req.file.size,
          path: req.file.path
        }
      });
    } catch (error) {
      console.error('Error in debug PDF upload endpoint:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during PDF processing'
      });
    }
  });
}