import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import pdfParse from 'pdf-parse-fork';
import { fileURLToPath } from 'url';
// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow PDFs
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
}).single('pdfFile');
/**
 * Method to test loading PDF with pdf-lib
 */
async function testPdfLib(filePath) {
    try {

        const fileData = fs.readFileSync(filePath);
        // Try to load with pdf-lib
        try {
            const pdfDoc = await PDFDocument.load(fileData);
            const pageCount = pdfDoc.getPageCount();
            return {
                success: true,
                pageCount,
                message: `PDF loaded successfully with pdf-lib. Found ${pageCount} pages.`
            };
        }
        catch (pdfLibError) {
            console.error('[PDF-LIB] Error loading PDF with pdf-lib:', pdfLibError);
            return {
                success: false,
                error: pdfLibError instanceof Error ? pdfLibError.message : String(pdfLibError),
                stack: pdfLibError instanceof Error ? pdfLibError.stack : undefined,
                message: 'Failed to load PDF with pdf-lib'
            };
        }
    }
    catch (fileError) {
        console.error(`[PDF-LIB] File system error: ${fileError}`);
        return {
            success: false,
            error: fileError instanceof Error ? fileError.message : String(fileError),
            message: 'Failed to read PDF file'
        };
    }
}
/**
 * Method to test extracting text from PDF with pdf-parse-fork
 */
async function testPdfParse(filePath) {
    try {

        const dataBuffer = fs.readFileSync(filePath);
        // Try to extract text
        try {
            const data = await pdfParse(dataBuffer);
            const textPreview = data.text.substring(0, 200) + (data.text.length > 200 ? '...' : '');
            return {
                success: true,
                numpages: data.numpages,
                numrender: data.numrender,
                info: data.info,
                metadata: data.metadata,
                textPreview,
                textLength: data.text.length,
                message: `Successfully extracted ${data.text.length} characters from PDF.`
            };
        }
        catch (error) {
            console.error('[PDF-PARSE] Error parsing PDF:', error);
            let errorMessage = 'Unknown error';
            let errorName = 'Unknown';
            let errorStack = '';
            if (error instanceof Error) {
                errorMessage = error.message;
                errorName = error.name;
                errorStack = error.stack || '';
            }
            else {
                errorMessage = String(error);
            }
            return {
                success: false,
                error: errorMessage,
                errorName,
                errorStack,
                message: 'Failed to extract text from PDF using pdf-parse-fork'
            };
        }
    }
    catch (error) {
        console.error('[PDF-PARSE] File system error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            message: 'Failed to read PDF file for parsing'
        };
    }
}
/**
 * Handler for the PDF test endpoint
 */
export async function handleTestPdfExtract(req, res) {
    upload(req, res, async function (err) {
        // Handle multer errors
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Error uploading file',
                error: err.message
            });
        }
        // Check if file was provided
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        try {
            const filePath = req.file.path;

            // Test loading with pdf-lib
            const pdfLibResult = await testPdfLib(filePath);
            // Test extracting with pdf-parse-fork
            const pdfParseResult = await testPdfParse(filePath);
            // Return combined results
            res.json({
                success: pdfLibResult.success && pdfParseResult.success,
                file: {
                    filename: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    path: filePath
                },
                pdfLib: pdfLibResult,
                pdfParse: pdfParseResult
            });
        }
        catch (error) {
            console.error('Unexpected error in PDF testing:', error);
            res.status(500).json({
                success: false,
                message: 'Unexpected error during PDF testing',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });
}
export default { handleTestPdfExtract };
