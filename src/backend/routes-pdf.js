import { requireAuth, requireLoginFallback } from './auth';
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
        }
        else {
            cb(new Error('Invalid file format! Only PDF files are allowed for reliable text extraction.'));
        }
    }
});
/**
 * Registers the updated resume-extract text endpoint with PDF parsing capabilities
 * @param app Express application or router
 */
export function registerPdfExtractRoutes(app) {
    // Enhanced test endpoints to verify the routes and extraction process work
    app.get("/api/resumes/test", (req, res) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
        const dirExists = fs.existsSync(uploadDir);
        const fileCount = dirExists ? fs.readdirSync(uploadDir).length : 0;
        res.json({
            message: "PDF extraction route is working properly",
            uploadDirectoryExists: dirExists,
            uploadDirectoryPath: uploadDir,
            uploadedFilesCount: fileCount,
            timestamp: new Date().toISOString(),
            serverVerified: true,
            maxFileSize: "5MB",
            supportedFileTypes: ["application/pdf", ".pdf"]
        });
    });
    // Diagnostic endpoint for upload directory testing
    app.get("/api/resumes/diagnostics", requireAuth, (req, res) => {
        try {
            // Create the uploads directory if it doesn't exist
            const uploadDir = ensureDirectoriesExist();
            // Check if it exists and has proper permissions
            const dirExists = fs.existsSync(uploadDir);
            const access = {
                read: false,
                write: false,
                execute: false
            };
            try {
                // Check read access
                fs.accessSync(uploadDir, fs.constants.R_OK);
                access.read = true;
            }
            catch (e) {
                // Can't read
            }
            try {
                // Check write access
                fs.accessSync(uploadDir, fs.constants.W_OK);
                access.write = true;
            }
            catch (e) {
                // Can't write
            }
            try {
                // Check execute access
                fs.accessSync(uploadDir, fs.constants.X_OK);
                access.execute = true;
            }
            catch (e) {
                // Can't execute
            }
            // List files in directory if possible with proper typing
            const files = [];
            if (dirExists && access.read) {
                const dirFiles = fs.readdirSync(uploadDir);
                // Only take the first 10 files to avoid overwhelming the response
                files.push(...dirFiles.slice(0, 10));
            }
            const response = {
                success: true,
                directory: {
                    path: uploadDir,
                    exists: dirExists,
                    access,
                    fileCount: files.length,
                    sampleFiles: files
                },
                multerConfigured: true,
                extractionEndpointsAvailable: [
                    "/api/resumes/extract",
                    "/api/resumes/upload",
                    "/api/resumes/extract-text"
                ],
                uploadDirectoryAutoCreated: true
            };
            res.json(response);
        }
        catch (error) {
            console.error("Diagnostics error:", error);
            res.status(500).json({
                success: false,
                message: "Error running diagnostics",
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
    // Direct file submission endpoint - processes file immediately with enhanced debugging
    app.post("/api/resumes/extract", requireLoginFallback, (req, res) => {
        console.log("=== Starting direct PDF extraction process ===");
        console.log(`User ID: ${req.user?.id}, Content-Type: ${req.headers['content-type']}`);
        // Add more detailed debugging
        console.log("Request headers:", JSON.stringify(req.headers, null, 2));
        // This is a more lenient approach that doesn't strictly check for multipart/form-data
        // Some browsers might send slightly different content-type headers
        if (!req.headers['content-type'] ||
            (!req.headers['content-type'].includes('multipart/form-data') &&
                !req.headers['content-type'].includes('form-data'))) {
            console.error("Invalid content type for direct file extraction:", req.headers['content-type']);
            return res.status(400).json({
                success: false,
                message: `Invalid content type: ${req.headers['content-type']}. Direct extraction requires multipart/form-data.`
            });
        }
        // Enhanced file upload handler with better error tracing
        const uploadHandler = upload.single('file');
        console.log("Starting multer upload handler processing...");
        uploadHandler(req, res, async function (err) {
            // Handle multer errors
            if (err) {
                console.error("File upload error during direct extraction:", err);
                console.error("Error stack:", err.stack);
                // Check for specific multer error types
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: "File too large. Maximum file size is 5MB."
                    });
                }
                else if (err.message?.includes('file format')) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid file type. Only PDF files are supported."
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: err.message || "Error uploading file for extraction",
                    errorType: err.name || "UploadError"
                });
            }
            // Enhanced file validation
            if (!req.file) {
                console.error("No file detected in the request");
                // Log additional form fields for debugging
                const formFields = req.body ? Object.keys(req.body).join(', ') : 'none';
                console.log(`Form fields received: ${formFields}`);
                return res.status(400).json({
                    success: false,
                    message: "No file provided for extraction. Make sure you're including a file with field name 'file'.",
                    receivedFields: formFields
                });
            }
            // Log detailed file information
            console.log(`File received: ${req.file.originalname} (${req.file.size} bytes, type: ${req.file.mimetype})`);
            console.log(`Stored at: ${req.file.path}`);
            try {
                // Import the simple PDF extractor module
                const { simplePdfExtract } = await import('./simple-pdf');
                console.log("Starting PDF text extraction...");
                // Extract text from the uploaded file
                const filePath = req.file.path;
                const { text, pages } = await simplePdfExtract(filePath);
                // Validate extracted text
                if (!text || text.trim().length === 0) {
                    console.error("Empty text returned from PDF extraction");
                    return res.status(400).json({
                        success: false,
                        message: "Extraction completed but no text was found in the document",
                        pages
                    });
                }
                const previewText = text.length > 100 ? `${text.substring(0, 100)}...` : text;
                console.log(`Successfully extracted text (${text.length} chars): ${previewText}`);
                // Return the extracted text and file info
                return res.json({
                    success: true,
                    text: text,
                    fileName: req.file.originalname,
                    pages: pages,
                    message: "Text successfully extracted from PDF"
                });
            }
            catch (extractError) {
                console.error("Error extracting text from PDF:", extractError);
                if (extractError instanceof Error) {
                    console.error("Error stack:", extractError.stack);
                }
                return res.status(500).json({
                    success: false,
                    message: "Error extracting text from the PDF",
                    error: extractError instanceof Error ? extractError.message : 'Unknown error'
                });
            }
        });
    });
    // Legacy endpoints for backward compatibility with enhanced debugging
    // Resume file upload endpoint
    app.post("/api/resumes/upload", requireLoginFallback, (req, res) => {
        console.log(`=== Legacy upload endpoint called by user ID: ${req.user?.id} ===`);
        console.log(`Content-Type: ${req.headers['content-type']}`);
        // Enhanced debugging
        console.log("Request headers:", JSON.stringify(req.headers, null, 2));
        // More lenient content-type checking for legacy endpoint
        if (!req.headers['content-type'] ||
            (!req.headers['content-type'].includes('multipart/form-data') &&
                !req.headers['content-type'].includes('form-data'))) {
            console.error("Invalid content type for legacy file upload:", req.headers['content-type']);
            return res.status(400).json({
                success: false,
                message: `Invalid content type: ${req.headers['content-type']}. File upload requires multipart/form-data.`
            });
        }
        console.log("Starting legacy upload multer processing...");
        // Handle file upload with multer and enhanced error handling
        upload.single('file')(req, res, function (err) {
            if (err) {
                console.error("Legacy file upload error:", err);
                console.error("Error stack:", err.stack);
                // Check for specific multer error types
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: "File too large. Maximum file size is 5MB."
                    });
                }
                else if (err.message?.includes('file format')) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid file type. Only PDF files are supported."
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: err.message || "Error uploading file",
                    errorType: err.name || "UploadError"
                });
            }
            // Enhanced file validation
            if (!req.file) {
                console.error("No file detected in the legacy upload request");
                // Log additional form fields for debugging
                const formFields = req.body ? Object.keys(req.body).join(', ') : 'none';
                console.log(`Legacy form fields received: ${formFields}`);
                return res.status(400).json({
                    success: false,
                    message: "No file provided for upload. Make sure you're including a file with field name 'file'.",
                    receivedFields: formFields
                });
            }
            // Log detailed file information
            console.log(`Legacy file upload successful: ${req.file.originalname} (${req.file.size} bytes, type: ${req.file.mimetype})`);
            console.log(`Stored at: ${req.file.path}`);
            // File uploaded successfully, return the path with enhanced information
            return res.json({
                success: true,
                message: "File uploaded successfully",
                fileName: req.file.originalname,
                filePath: req.file.path,
                fileSize: req.file.size,
                fileType: req.file.mimetype,
                uuid: path.basename(req.file.path).split('_')[2] // Extract the UUID part for tracking
            });
        });
    });
    // Legacy text extraction endpoint with enhanced error handling
    app.post("/api/resumes/extract-text", requireLoginFallback, async (req, res) => {
        try {
            console.log("=== Legacy extract-text endpoint called ===");
            console.log(`User ID: ${req.user?.id}, Content-Type: ${req.headers['content-type']}`);
            // Enhanced debugging
            console.log("Request headers:", JSON.stringify(req.headers, null, 2));
            console.log("Request body:", JSON.stringify(req.body, null, 2));
            // Import the simple PDF extractor module
            const { simplePdfExtract } = await import('./simple-pdf');
            // Check if we're receiving a file path or direct text
            const { filePath, text } = req.body;
            console.log(`Extract text request with filePath: ${filePath ? filePath : 'none'}, text available: ${text ? 'yes' : 'no'}`);
            // If direct text is provided, return it as is (useful for testing)
            if (text) {
                console.log("Direct text provided, skipping extraction");
                return res.json({
                    success: true,
                    text: text,
                    message: "Direct text provided, no extraction needed"
                });
            }
            // If no file path is provided, return a detailed error
            if (!filePath) {
                console.error("No file path provided in extract-text request");
                return res.status(400).json({
                    success: false,
                    message: "No file path or text provided",
                    receivedBody: req.body ? Object.keys(req.body).join(', ') : 'none'
                });
            }
            // Validate the file path
            if (typeof filePath !== 'string') {
                console.error("Invalid file path format:", filePath);
                return res.status(400).json({
                    success: false,
                    message: "Invalid file path format. Expected string.",
                    receivedType: typeof filePath
                });
            }
            // Check if the file exists before extraction
            if (!fs.existsSync(filePath)) {
                console.error(`File not found at path: ${filePath}`);
                return res.status(404).json({
                    success: false,
                    message: "File not found at the specified path",
                    path: filePath
                });
            }
            try {
                console.log(`Starting PDF extraction from path: ${filePath}`);
                // Extract text from the PDF file
                const { text: extractedText, pages } = await simplePdfExtract(filePath);
                // Validate extracted text
                if (!extractedText || extractedText.trim().length === 0) {
                    console.error("Empty text returned from PDF extraction at path:", filePath);
                    return res.status(400).json({
                        success: false,
                        message: "Extraction completed but no text was found in the document",
                        pages
                    });
                }
                const previewText = extractedText.length > 100 ? `${extractedText.substring(0, 100)}...` : extractedText;
                console.log(`Successfully extracted text (${extractedText.length} chars): ${previewText}`);
                // Return the extracted text
                return res.json({
                    success: true,
                    text: extractedText,
                    message: "Text extracted successfully from PDF",
                    pages
                });
            }
            catch (extractError) {
                console.error("PDF extraction error:", extractError);
                if (extractError instanceof Error) {
                    console.error("Error stack:", extractError.stack);
                }
                return res.status(400).json({
                    success: false,
                    message: "Error extracting text from PDF",
                    error: extractError instanceof Error ? extractError.message : 'Unknown error',
                    path: filePath
                });
            }
        }
        catch (error) {
            console.error("Error in extract-text endpoint:", error);
            if (error instanceof Error) {
                console.error("Error stack:", error.stack);
            }
            res.status(500).json({
                success: false,
                message: "Error processing extraction request",
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}
