import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileUp, UploadCloud, AlertCircle, Loader2, BarChart4, 
  Sparkles, CheckCircle2, Trash2, Info, FileText
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import JobDescriptionInput from '@/components/JobDescriptionInput';

interface ResumeAnalyzerProps {
  onExtractComplete: (text: string) => void;
  onAnalyzeComplete?: (results: any) => void;
  jobDescription: string;
  setJobDescription: (text: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  onExtractComplete,
  onAnalyzeComplete,
  jobDescription,
  setJobDescription,
  isAnalyzing,
  onAnalyze
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [hasExtractedText, setHasExtractedText] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileDropRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setHasExtractedText(false);
    
    // Reset any previous upload state if user is selecting a new file
    if (file) {
      setFile(null);
      setResumeText('');
    }
    
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      const errorMsg = 'No file selected in handleFileChange';
      console.error(errorMsg);
      toast({
        title: 'No File Selected',
        description: 'Please select a valid PDF file to continue.',
        variant: 'destructive',
      });
      return;
    }
    
    // Enhanced logging with detailed file info
    console.log('File selected:', {
      name: selectedFile.name,
      type: selectedFile.type || 'unknown type',
      size: `${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`,
      lastModified: new Date(selectedFile.lastModified).toISOString()
    });
    
    // Check file type - allow both explicit application/pdf and for browsers 
    // that may report different MIME types for PDFs
    const fileType = selectedFile.type.toLowerCase();
    const fileName = selectedFile.name.toLowerCase();
    const isPdf = fileType === 'application/pdf' || 
                 fileType === 'application/x-pdf' || 
                 fileName.endsWith('.pdf');
    
    if (!isPdf) {
      const errorMsg = `Invalid file type: ${fileType || 'unknown'}. Please upload a PDF file.`;
      console.error(errorMsg);
      setError('Currently, we only support PDF files for reliable text extraction.');
      toast({
        title: 'Invalid File Type',
        description: 'Only PDF files are supported. Please upload a PDF document.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      const errorMsg = `File size (${sizeMB}MB) exceeds the 5MB limit.`;
      console.error(errorMsg);
      setError('File size must be less than 5MB.');
      toast({
        title: 'File Too Large',
        description: `Your file is ${sizeMB}MB. Please upload a file smaller than 5MB.`,
        variant: 'destructive',
      });
      return;
    }
    
    // Check if file has content
    if (selectedFile.size === 0) {
      const errorMsg = 'The selected file appears to be empty (0 bytes).';
      console.error(errorMsg);
      setError('The selected file appears to be empty.');
      toast({
        title: 'Empty File',
        description: 'The selected file appears to be empty. Please choose a valid PDF file.',
        variant: 'destructive',
      });
      return;
    }
    
    // Store the file in state
    setFile(selectedFile);
    
    // Auto-process when a file is selected after a brief delay
    // to ensure the file state is properly set
    setTimeout(() => {
      processFile();
    }, 300); // Slightly longer delay to ensure state is updated
  };

  const processFile = async () => {
    if (!file) {
      const errorMsg = 'Please select a PDF file first.';
      console.error(errorMsg);
      setError(errorMsg);
      toast({
        title: 'No File Selected',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Display proper loading states
      setUploading(true);
      setExtracting(true);
      setError(null);
      setHasExtractedText(false);

      console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size, "Last Modified:", new Date(file.lastModified).toISOString());

      // Extra validation before proceeding
      if (!file.type && !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('File appears to be missing type information and does not have a .pdf extension');
      }

      // Comprehensive file validation
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const isPdf = fileType === 'application/pdf' || 
                   fileType === 'application/x-pdf' || 
                   fileName.endsWith('.pdf');
                   
      if (!isPdf) {
        const errorMsg = `Invalid file type: ${fileType || 'unknown'}. Only PDF files are supported.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // File size validation with more detailed message
      if (file.size > 5 * 1024 * 1024) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const errorMsg = `File size (${sizeMB}MB) exceeds the 5MB limit.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      if (file.size === 0) {
        const errorMsg = 'The selected file appears to be empty (0 bytes).';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Verify file has content by checking arrayBuffer
      try {
        const buffer = await file.arrayBuffer();
        if (buffer.byteLength === 0) {
          throw new Error('File has zero bytes content although size property shows non-zero');
        }
        console.log(`File integrity check: Successfully read ${buffer.byteLength} bytes from file`);
      } catch (e) {
        const bufferError = e instanceof Error ? e : new Error('Unknown error reading file');
        console.error("Failed to read file content:", bufferError);
        throw new Error(`Cannot read file content: ${bufferError.message}`);
      }

      // First try the direct extraction method (new approach)
      try {
        console.log("Attempting direct extraction method first via /api/resumes/extract endpoint");
        
        // Create a diagnostic copy of the file data for verification
        const fileCopy = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
        console.log("File blob created successfully:", {
          originalSize: file.size,
          blobSize: fileCopy.size,
          blobType: fileCopy.type
        });
        
        // Attempt direct extraction with better error diagnostics
        await extractTextWithDirectEndpoint();
        console.log("Direct extraction method succeeded!");
        
        // Show success toast
        toast({
          title: 'Resume Processed',
          description: 'Your resume has been successfully analyzed.',
          variant: 'default',
        });
      } catch (directError) {
        console.error("Direct extraction failed with error:", directError);
        
        // Show warning toast for fallback
        toast({
          title: 'Using Backup Method',
          description: 'Trying alternative extraction approach...',
          variant: 'default',
        });
        
        // If direct method fails, try the legacy approach with detailed fallback logging
        console.log("Falling back to legacy two-step extraction method");
        try {
          await legacyExtractProcess();
          console.log("Legacy extraction method succeeded!");
          
          // Show success toast
          toast({
            title: 'Resume Processed',
            description: 'Your resume was successfully analyzed using our backup method.',
            variant: 'default',
          });
        } catch (e) {
          const legacyError = e instanceof Error ? e : new Error('Unknown legacy extraction error');
          console.error("Legacy extraction also failed:", legacyError);
          throw new Error(`All extraction methods failed. Last error: ${legacyError.message}`);
        }
      }
      
    } catch (error) {
      console.error("All extraction methods failed:", error);
      handleProcessError(error);
    }
  };

  // New method: Upload and extract in a single step with more debugging
  const extractTextWithDirectEndpoint = async () => {
    if (!file) {
      throw new Error('No file selected');
    }
    
    console.log("Using direct extraction endpoint for file:", file.name, "Size:", file.size, "Type:", file.type);
    
    try {
      // Create a fresh FormData instance
      const formData = new FormData();

      // Create a new File instance with explicit mimetype to avoid browser inconsistencies
      const fileBlob = file.slice(0, file.size, 'application/pdf');
      const pdfFile = new File([fileBlob], file.name, {
        type: 'application/pdf',
        lastModified: file.lastModified
      });
      
      // Add the file to the form data
      formData.append('file', pdfFile);

      // Add a simple field to ensure FormData is working properly
      formData.append('filename', file.name);
      formData.append('filesize', file.size.toString());
      
      // Enhanced debugging to log the actual form data contents
      console.log("Enhanced FormData created with file object:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: 'application/pdf',
        fileObjectType: pdfFile.type,
        fileObjectSize: pdfFile.size,
        containsFile: formData.has('file'),
        containsFilename: formData.has('filename'),
        containsFilesize: formData.has('filesize')
      });

      console.log("⚠️ Submitting form data to /api/resumes/extract...");
      
      // Send form data to the extraction endpoint with enhanced error handling
      const response = await fetch('/api/resumes/extract', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      });
      
      // Check for HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Direct extraction failed:", errorText);
        throw new Error(`Extraction failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
      }
      
      // Parse the JSON response safely
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse direct extraction response as JSON:", jsonError);
        throw new Error('Invalid JSON response from extraction endpoint');
      }
      
      // Validate that we have the expected data
      if (!result.success || !result.text) {
        console.error("Invalid extraction result:", result);
        throw new Error('Server returned success but without extracted text');
      }
      
      // Success - process the extracted text
      console.log("Direct extraction successful, text length:", result.text.length);
      handleExtractSuccess(result.text);
    } catch (error) {
      console.error("Detailed direct extraction error:", error);
      throw error; // Re-throw to be handled by the caller
    }
  };
  
  // Legacy method: Upload first, then extract - with enhanced debugging and handling
  const legacyExtractProcess = async () => {
    if (!file) {
      throw new Error('No file selected');
    }
    
    console.log("⚠️ Falling back to legacy two-step process for file:", file.name, "Size:", file.size, "Type:", file.type);
    
    try {
      // Create a fresh FormData instance for the file upload
      const formData = new FormData();

      // Create a new File instance with explicit mimetype to avoid browser inconsistencies
      const fileBlob = file.slice(0, file.size, 'application/pdf');
      const pdfFile = new File([fileBlob], file.name, {
        type: 'application/pdf',
        lastModified: file.lastModified
      });
      
      // Add the file to the form data
      formData.append('file', pdfFile);

      // Add debug fields to ensure FormData is working properly
      formData.append('filename', file.name);
      formData.append('filesize', file.size.toString());
      formData.append('method', 'legacy');
      
      // Enhanced debugging to log the actual form data contents
      console.log("Enhanced legacy FormData created with file object:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: 'application/pdf',
        fileObjectType: pdfFile.type,
        fileObjectSize: pdfFile.size,
        containsFile: formData.has('file'),
        containsFilename: formData.has('filename'),
        containsFilesize: formData.has('filesize'),
        containsMethod: formData.has('method')
      });
      
      // Step 1: Upload the file
      const uploadResponse = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.text();
        console.error("Legacy upload error:", errorBody);
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorBody.substring(0, 100)}`);
      }
      
      let uploadResult;
      try {
        uploadResult = await uploadResponse.json();
      } catch (jsonError) {
        console.error("Failed to parse upload response as JSON:", jsonError);
        throw new Error('Invalid JSON response from upload endpoint');
      }
      
      if (!uploadResult.success || !uploadResult.filePath) {
        console.error("Invalid upload result:", uploadResult);
        throw new Error('Upload was successful but response format was invalid');
      }
      
      console.log("Legacy upload successful, proceeding to extraction. FilePath:", uploadResult.filePath);
      
      // Step 2: Extract text from the uploaded file
      const extractResponse = await fetch('/api/resumes/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: uploadResult.filePath }),
        credentials: 'include'
      });
      
      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error("Legacy extraction error:", errorText);
        throw new Error(`Text extraction failed: ${extractResponse.status} - ${errorText.substring(0, 100)}`);
      }
      
      let extractResult;
      try {
        extractResult = await extractResponse.json();
      } catch (jsonError) {
        console.error("Failed to parse extraction response as JSON:", jsonError);
        throw new Error('Invalid JSON response from extraction endpoint');
      }
      
      if (!extractResult.success || !extractResult.text) {
        console.error("Invalid extraction result:", extractResult);
        throw new Error('Text extraction successful but response format was invalid');
      }
      
      handleExtractSuccess(extractResult.text);
    } catch (error) {
      console.error("Detailed legacy extraction error:", error);
      throw error; // Re-throw to be handled by the caller
    }
  };
  
  // Handle successful extraction
  const handleExtractSuccess = (text: string) => {
    setResumeText(text);
    setUploading(false);
    setExtracting(false);
    setHasExtractedText(true);
    
    toast({
      title: 'Resume Uploaded!',
      description: 'Text extracted successfully. You can now add a job description.',
      variant: 'default',
    });
    
    // Call the completion handler
    onExtractComplete(text);
  };
  
  // Handle errors during the extraction process with better diagnostics
  const handleProcessError = (error: unknown) => {
    // Reset all loading states
    setUploading(false);
    setExtracting(false);
    
    // Get a better error message with more context
    let errorMessage: string;
    let errorDetails: string = '';
    let errorCategory: 'file_size' | 'file_type' | 'file_empty' | 'network' | 'parsing' | 'authentication' | 'server' | 'extraction' | 'unknown' = 'unknown';
    
    // Categorize the error to provide more specific help
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
      
      // Enhanced error categorization with more comprehensive pattern matching
      if (errorMessage.includes('file size') || errorMessage.includes('5MB') || 
          errorMessage.includes('too large') || errorMessage.includes('LIMIT_FILE_SIZE')) {
        errorCategory = 'file_size';
      } else if (errorMessage.includes('file type') || errorMessage.includes('PDF') || 
                errorMessage.includes('application/pdf') || errorMessage.includes('Invalid file type')) {
        errorCategory = 'file_type';
      } else if (errorMessage.includes('empty') || errorMessage.includes('0 bytes') || 
                errorMessage.includes('zero bytes') || errorMessage.includes('no text was found')) {
        errorCategory = 'file_empty';
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network') || 
                errorMessage.includes('failed to fetch') || errorMessage.includes('Failed to fetch') ||
                errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        errorCategory = 'network';
      } else if (errorMessage.includes('JSON') || errorMessage.includes('parse') ||
                errorMessage.includes('Invalid JSON')) {
        errorCategory = 'parsing';
      } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || 
                errorMessage.includes('Unauthorized') || errorMessage.includes('authentication')) {
        errorCategory = 'authentication';
      } else if (errorMessage.includes('500') || errorMessage.includes('server error') || 
                errorMessage.includes('internal server')) {
        errorCategory = 'server';
      } else if (errorMessage.includes('extraction') || errorMessage.includes('text extract') || 
                errorMessage.includes('No text content found')) {
        errorCategory = 'extraction';
      }
    } else if (error && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
        
        // Try to categorize JSON error messages as well
        if (errorMessage.includes('size') || errorMessage.includes('large')) {
          errorCategory = 'file_size';
        } else if (errorMessage.includes('type') || errorMessage.includes('PDF')) {
          errorCategory = 'file_type';
        } else if (errorMessage.includes('empty') || errorMessage.includes('bytes')) {
          errorCategory = 'file_empty';
        }
      } catch (e) {
        errorMessage = String(error);
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
      
      // Also try to categorize string errors
      if (error.includes('file size') || error.includes('too large')) {
        errorCategory = 'file_size';
      } else if (error.includes('file type') || error.includes('PDF')) {
        errorCategory = 'file_type';
      } else if (error.includes('empty') || error.includes('no text')) {
        errorCategory = 'file_empty';
      } else if (error.includes('401') || error.includes('unauthorized')) {
        errorCategory = 'authentication';
      } else if (error.includes('500') || error.includes('server error')) {
        errorCategory = 'server';
      }
    } else {
      errorMessage = 'An unknown error occurred during file processing';
    }
    
    // Log detailed error information for debugging
    console.error("Final error during file processing:", {
      message: errorMessage,
      details: errorDetails,
      category: errorCategory,
      originalError: error
    });
    
    // Get a user-friendly error message
    const userErrorMessage = getHumanReadableError(errorMessage, errorCategory);
    
    // Set user-facing error message
    setError(userErrorMessage);
    
    // Show helpful toast with potential solutions based on error category
    switch (errorCategory) {
      case 'file_size':
        toast({
          title: 'File Too Large',
          description: 'Please upload a PDF file smaller than 5MB. Try compressing your PDF or uploading a simpler version.',
          variant: 'destructive',
        });
        break;
      case 'file_type':
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a valid PDF file. Other file formats are not supported at this time.',
          variant: 'destructive',
        });
        break;
      case 'file_empty':
        toast({
          title: 'Empty or Unreadable File',
          description: 'No text could be extracted from this file. Please upload a PDF with selectable text content.',
          variant: 'destructive',
        });
        break;
      case 'network':
        toast({
          title: 'Connection Error',
          description: 'There was a problem connecting to the server. Please check your internet connection and try again.',
          variant: 'destructive',
        });
        break;
      case 'parsing':
        toast({
          title: 'Processing Error',
          description: 'There was an issue processing the file. Please try a different PDF file format.',
          variant: 'destructive',
        });
        break;
      case 'authentication':
        toast({
          title: 'Authentication Error',
          description: 'Your session may have expired. Please refresh the page and try again.',
          variant: 'destructive',
        });
        break;
      case 'server':
        toast({
          title: 'Server Error',
          description: 'We encountered a server error while processing your file. Please try again later.',
          variant: 'destructive',
        });
        break;
      case 'extraction':
        toast({
          title: 'Text Extraction Failed',
          description: 'We couldn\'t extract text from your PDF. Try a PDF with selectable text rather than scanned images.',
          variant: 'destructive',
        });
        break;
      default:
        toast({
          title: 'Extraction Failed',
          description: 'Could not extract text from the PDF. Please try another file or contact support.',
          variant: 'destructive',
        });
    }
    
    // Reset file input if we had a critical error
    if (['file_type', 'file_empty', 'file_size', 'extraction'].includes(errorCategory)) {
      resetFileInput();
    }
  };
  
  // Helper function to convert technical errors to human-readable messages
  const getHumanReadableError = (errorMessage: string, category: string): string => {
    // If the error message is too technical, simplify it
    if (errorMessage.includes("TypeError") || 
        errorMessage.includes("SyntaxError") || 
        errorMessage.includes("object Object")) {
      return "Technical error occurred during processing.";
    }
    
    switch(category) {
      case 'file_size':
        return 'Your file is too large. Please keep it under 5MB.';
      case 'file_type':
        return 'Only PDF files are supported at this time.';
      case 'file_empty':
        return 'We couldn\'t find any text in this file. Make sure it contains text that can be selected.';
      case 'network':
        return 'Connection problem. Please check your internet and try again.';
      case 'parsing':
        return 'There was a problem reading your file. Try a different PDF.';
      case 'authentication':
        return 'Your session may have expired. Please refresh the page.';
      case 'server':
        return 'Our server encountered an issue. Please try again later.';
      case 'extraction':
        return 'We couldn\'t extract text from your PDF. Try a PDF with selectable text rather than scanned images.';
      default:
        // For unknown errors, clean up the message if it's too technical
        if (errorMessage.includes('Error: ')) {
          return errorMessage.replace('Error: ', '');
        }
        return errorMessage || 'An unknown error occurred during file processing.';
    }
  };
  
  // Handle successful extraction
  const handleExtractSuccess = (text: string) => {
    // Update state
    setResumeText(text);
    setHasExtractedText(true);
    setUploading(false);
    setExtracting(false);
    
    // Trigger callback
    onExtractComplete(text);
  };
  
  // Process the file for text extraction
  const processFile = async () => {
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Start loading state
      setUploading(true);
      setError(null);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add debugging data
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      
      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);
      
      // Direct extraction approach
      const response = await fetch('/api/resumes/extract', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`File extraction failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.text) {
        throw new Error(result.message || 'Extraction failed to retrieve text');
      }
      
      // Successful extraction
      console.log("Extraction successful, text length:", result.text.length);
      setExtracting(false);
      handleExtractSuccess(result.text);
      
      toast({
        title: 'Success',
        description: 'Resume text extracted successfully',
        variant: 'default',
      });
      
    } catch (error) {
      console.error("PDF extraction error:", error);
      handleProcessError(error);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (fileDropRef.current) {
      fileDropRef.current.classList.add('bg-gray-100', 'border-primary');
    }
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (fileDropRef.current) {
      fileDropRef.current.classList.add('bg-gray-100', 'border-primary');
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (fileDropRef.current) {
      // Only remove the highlight if we're leaving the container (not entering a child)
      const rect = fileDropRef.current.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      
      if (
        x <= rect.left ||
        x >= rect.right ||
        y <= rect.top ||
        y >= rect.bottom
      ) {
        fileDropRef.current.classList.remove('bg-gray-100', 'border-primary');
      }
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileDropRef.current) {
      fileDropRef.current.classList.remove('bg-gray-100', 'border-primary');
    }
    
    try {
      const droppedFiles = e.dataTransfer.files;
      console.log("Files dropped:", droppedFiles.length, "files");
      
      if (droppedFiles?.length) {
        // Validate file type before handling
        const droppedFile = droppedFiles[0];
        const fileType = droppedFile.type.toLowerCase();
        const fileName = droppedFile.name.toLowerCase();
        
        console.log("Dropped file details:", {
          name: droppedFile.name,
          type: droppedFile.type,
          size: `${(droppedFile.size / 1024 / 1024).toFixed(2)}MB`
        });
        
        const isPdf = fileType === 'application/pdf' || 
                      fileType === 'application/x-pdf' || 
                      fileName.endsWith('.pdf');
        
        if (!isPdf) {
          toast({
            title: 'Invalid File Type',
            description: 'Please upload a PDF file only.',
            variant: 'destructive',
          });
          return;
        }
        
        if (droppedFile.size > 5 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: `File size (${(droppedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds the 5MB limit.`,
            variant: 'destructive',
          });
          return;
        }
        
        // Simulate the file input change
        const event = {
          target: {
            files: droppedFiles
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        handleFileChange(event);
      }
    } catch (error) {
      console.error("Error handling dropped file:", error);
      toast({
        title: 'Upload Error',
        description: 'An error occurred while processing the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setError(null);
    setHasExtractedText(false);
    setResumeText('');
  };

  const loadExampleJobDescription = () => {
    setJobDescription(
      "We're hiring a Salesforce Data Architect to lead integrations and mentor technical teams. The ideal candidate has 5+ years experience with Salesforce, strong API development skills, and can design scalable data models. You'll work with cross-functional teams to implement complex integration solutions, optimize data flows, and ensure security compliance. Required skills: Salesforce certification, SQL, REST APIs, data migration, and excellent communication skills."
    );
  };

  // Determine if analyze button should be enabled
  const canAnalyze = !isAnalyzing && resumeText && jobDescription.trim();

  // Button text changes based on state
  const getButtonText = () => {
    if (isAnalyzing) {
      return "Analyzing...";
    } else if (hasExtractedText && !jobDescription.trim()) {
      return "Add Job Description";
    } else if (!hasExtractedText) {
      return "Upload Resume First";
    } else {
      return "Analyze Resume";
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 bg-gradient-to-b from-white to-[#f0f6ff] shadow-md shadow-gray-200">
      <CardContent className="pt-6 bg-transparent">
        <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center">
          <FileUp className="h-5 w-5 mr-2" />
          Analyze Your Resume
        </h3>
        
        <div className="space-y-6">
          {/* Upload Resume */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-primary mr-1">1.</span> Upload Resume <span className="text-red-500 ml-1">*</span>
              </div>
              {hasExtractedText && (
                <span className="text-green-600 text-xs font-medium flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Resume uploaded
                </span>
              )}
            </Label>
            
            <div className="border-2 border-dashed rounded-md border-gray-200 p-4 bg-gray-50 flex flex-col items-center justify-center" ref={fileDropRef}>
              <form id="resumeForm" className="w-full" encType="multipart/form-data">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="application/pdf,.pdf"
                  name="file"
                  id="resumeUpload"
                />
              
                {!file ? (
                  <div 
                    className="text-center py-4 w-full relative"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <UploadCloud className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                    <p className="text-neutral-600 mb-2">Drop your resume PDF here or</p>
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1"
                      disabled={uploading || extracting}
                      size="sm"
                    >
                      Browse Files
                    </Button>
                    <p className="text-xs text-neutral-500 mt-2">PDF files only, up to 5MB</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center justify-between bg-white p-2 rounded border border-neutral-200 mb-3">
                      <div className="flex items-center">
                        <div className={`${hasExtractedText ? 'bg-green-100' : 'bg-primary/10'} p-2 rounded`}>
                          {hasExtractedText ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <span className="ml-2 text-sm truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={resetFileInput}
                              disabled={uploading || extracting}
                              className="h-8 w-8 text-neutral-500 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove file</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {(!hasExtractedText && !(uploading || extracting)) && (
                      <Button 
                        type="button"
                        onClick={processFile}
                        disabled={uploading || extracting}
                        className="w-full"
                        size="sm"
                      >
                        Process Resume
                      </Button>
                    )}
                    
                    {(uploading || extracting) && (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-sm">{uploading ? 'Uploading...' : 'Extracting Text...'}</span>
                      </div>
                    )}
                    
                    {hasExtractedText && (
                      <div className="bg-green-50 text-green-700 p-2 text-sm rounded flex items-center">
                        <div className="bg-green-100 p-1 rounded-full mr-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        </div>
                        Resume processed successfully
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
            
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          {/* Enter Job Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-primary mr-1">2.</span> Job Description <span className="text-red-500 ml-1">*</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadExampleJobDescription}
                className="h-6 text-xs text-primary"
              >
                Paste Example
              </Button>
            </Label>
            
            <JobDescriptionInput
              value={jobDescription}
              onChange={setJobDescription}
              className="min-h-[150px] border-slate-200"
              minLength={100}
              isAnalyzing={isAnalyzing}
              placeholder="We're hiring a Salesforce Data Architect to lead integrations and mentor technical teams..."
            />
          </div>
          
          {/* Analyze Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full">
                  <Button 
                    className="w-full relative transition-all duration-300" 
                    onClick={onAnalyze}
                    disabled={!canAnalyze}
                    id="analyzeBtn"
                    variant={isAnalyzing ? "outline" : "default"}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <BarChart4 className="h-4 w-4 mr-2" />
                        {getButtonText()}
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>AI will compare your resume against the job description to identify strengths, gaps, and suggestions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* The textarea for the resume text is hidden from the user */}
          <input type="hidden" id="extractedResumeText" value={resumeText} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzer;