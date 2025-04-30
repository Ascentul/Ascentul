import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { simplePdfExtract } from '../simple-pdf';

// Create the router
const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'pdf-test');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `test-${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Test page
router.get('/pdf-test', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PDF Text Extraction Test</title>
      <style>
        body { font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2563eb; }
        h2 { color: #4b5563; margin-top: 2em; }
        button, .button { background-color: #2563eb; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover, .button:hover { background-color: #1d4ed8; }
        .card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .error { color: #ef4444; font-weight: 500; }
        .success { color: #10b981; font-weight: 500; }
        textarea { width: 100%; height: 200px; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-family: monospace; margin-top: 10px; }
        input[type="file"] { margin-bottom: 15px; }
        .dropzone { border: 2px dashed #d1d5db; border-radius: 4px; padding: 40px; text-align: center; margin-bottom: 20px; }
        .dropzone.active { border-color: #2563eb; background-color: #eff6ff; }
        #debug { font-family: monospace; white-space: pre-wrap; background-color: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 4px; margin-top: 20px; max-height: 300px; overflow-y: auto; }
      </style>
    </head>
    <body>
      <h1>PDF Text Extraction Test</h1>
      <p>This page allows you to test the PDF text extraction functionality in different ways.</p>
      
      <h2>Method 1: Simple Form Upload</h2>
      <div class="card">
        <form action="/api/test-pdf-upload" method="post" enctype="multipart/form-data">
          <div>
            <input type="file" name="pdf" accept="application/pdf" required />
          </div>
          <button type="submit">Upload and Extract Text</button>
        </form>
      </div>
      
      <h2>Method 2: AJAX Upload</h2>
      <div class="card">
        <div class="dropzone" id="dropzone">
          <p>Drag & drop your PDF here or</p>
          <input type="file" id="fileInput" accept="application/pdf" />
        </div>
        <button id="extractButton" disabled>Extract Text</button>
        <div id="result" style="margin-top: 15px;">
          <h3>Extracted Text:</h3>
          <textarea id="extractedText" readonly></textarea>
        </div>
      </div>
      
      <h2>Debug Output</h2>
      <div id="debug"></div>
      
      <script>
        const debugLog = document.getElementById('debug');
        const extractButton = document.getElementById('extractButton');
        const fileInput = document.getElementById('fileInput');
        const extractedText = document.getElementById('extractedText');
        const dropzone = document.getElementById('dropzone');
        
        function log(message, isError = false) {
          const time = new Date().toLocaleTimeString();
          const entry = document.createElement('div');
          entry.textContent = \`[\${time}] \${message}\`;
          entry.className = isError ? 'error' : '';
          debugLog.appendChild(entry);
          debugLog.scrollTop = debugLog.scrollHeight;
          console.log(\`[\${time}] \${message}\`);
        }
        
        // File input change handler
        fileInput.addEventListener('change', function() {
          if (this.files.length > 0) {
            const file = this.files[0];
            if (file.type !== 'application/pdf') {
              log('Error: Only PDF files are allowed', true);
              extractButton.disabled = true;
              return;
            }
            
            log(\`Selected file: \${file.name} (\${Math.round(file.size / 1024)} KB)\`);
            extractButton.disabled = false;
          } else {
            extractButton.disabled = true;
          }
        });
        
        // Extract button click handler
        extractButton.addEventListener('click', function() {
          if (!fileInput.files.length) {
            log('No file selected', true);
            return;
          }
          
          const file = fileInput.files[0];
          log(\`Starting extraction for \${file.name}...\`);
          
          const formData = new FormData();
          formData.append('pdf', file);
          
          extractedText.value = 'Extracting text, please wait...';
          
          fetch('/api/test-pdf-upload', {
            method: 'POST',
            body: formData
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(\`Server responded with status: \${response.status}\`);
            }
            return response.json();
          })
          .then(data => {
            if (data.success) {
              log('Text extraction successful');
              extractedText.value = data.text;
            } else {
              log(\`Extraction failed: \${data.error}\`, true);
              extractedText.value = \`Error: \${data.error}\`;
            }
          })
          .catch(error => {
            log(\`Error: \${error.message}\`, true);
            extractedText.value = \`Error: \${error.message}\`;
          });
        });
        
        // Drag and drop handling
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropzone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
          dropzone.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
          dropzone.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
          dropzone.classList.add('active');
        }
        
        function unhighlight() {
          dropzone.classList.remove('active');
        }
        
        dropzone.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
          const dt = e.dataTransfer;
          const files = dt.files;
          
          if (files.length) {
            const file = files[0];
            if (file.type !== 'application/pdf') {
              log('Error: Only PDF files are allowed', true);
              return;
            }
            
            fileInput.files = files;
            log(\`File dropped: \${file.name} (\${Math.round(file.size / 1024)} KB)\`);
            extractButton.disabled = false;
          }
        }
        
        log('PDF Test page loaded successfully');
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// API endpoint for PDF text extraction
router.post('/test-pdf-upload', upload.single('pdf'), async (req, res) => {
  try {
    console.log('PDF test upload called');
    
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file was uploaded'
      });
    }
    
    console.log(`Processing PDF file: ${req.file.originalname}, saved as ${req.file.filename}`);
    
    // Extract text using our simple extractor
    const result = await simplePdfExtract(req.file.path);
    
    return res.json({
      success: true,
      text: result.text,
      pages: result.pages
    });
  } catch (error) {
    console.error('Error in PDF test upload:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;