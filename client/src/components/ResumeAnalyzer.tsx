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
      console.log('No file selected in handleFileChange');
      return;
    }
    
    // Check file type - allow both explicit application/pdf and for browsers 
    // that may report different MIME types for PDFs
    const fileType = selectedFile.type.toLowerCase();
    const fileName = selectedFile.name.toLowerCase();
    const isPdf = fileType === 'application/pdf' || 
                 fileType === 'application/x-pdf' || 
                 fileName.endsWith('.pdf');
    
    console.log('Selected file:', selectedFile.name, 'Type:', fileType, 'Size:', selectedFile.size, 'Is PDF:', isPdf);
    
    if (!isPdf) {
      setError('Currently, we only support PDF files for reliable text extraction.');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    
    // Check if file has content
    if (selectedFile.size === 0) {
      setError('The selected file appears to be empty.');
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
      setUploading(true);
      setExtracting(true);
      setError(null);

      console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size, "Last Modified:", new Date(file.lastModified).toISOString());

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
        
        await extractTextWithDirectEndpoint();
        console.log("Direct extraction method succeeded!");
      } catch (directError) {
        console.error("Direct extraction failed with error:", directError);
        
        // If direct method fails, try the legacy approach with detailed fallback logging
        console.log("Falling back to legacy two-step extraction method");
        try {
          await legacyExtractProcess();
          console.log("Legacy extraction method succeeded!");
        } catch (legacyError) {
          console.error("Legacy extraction also failed:", legacyError);
          throw new Error(`All extraction methods failed. Last error: ${legacyError.message}`);
        }
      }
      
    } catch (error) {
      console.error("All extraction methods failed:", error);
      handleProcessError(error);
    }
  };

  // New method: Upload and extract in a single step
  const extractTextWithDirectEndpoint = async () => {
    if (!file) {
      throw new Error('No file selected');
    }
    
    console.log("Using direct extraction endpoint for file:", file.name, "Size:", file.size, "Type:", file.type);
    
    try {
      // Create a fresh FormData instance
      const formData = new FormData();
      
      // Create a new Blob with the correct MIME type to ensure consistent handling
      const fileBlob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
      
      // Make sure we're using the right field name that the server expects
      formData.append('file', fileBlob, file.name);
      
      console.log("FormData created with file field and proper MIME type");
      
      // Send form data to the extraction endpoint
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
  
  // Legacy method: Upload first, then extract
  const legacyExtractProcess = async () => {
    if (!file) {
      throw new Error('No file selected');
    }
    
    console.log("Using legacy two-step process for file:", file.name, "Size:", file.size, "Type:", file.type);
    
    try {
      // Create a fresh FormData instance for the file upload
      const formData = new FormData();
      
      // Create a new Blob with the correct MIME type to ensure consistent handling
      const fileBlob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });
      
      // Make sure we're using the correct field name
      formData.append('file', fileBlob, file.name);
      
      console.log("FormData created for legacy upload with file field and correct MIME type");
      
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
    setUploading(false);
    setExtracting(false);
    
    // Get a better error message with more context
    let errorMessage: string;
    let errorDetails: string = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    } else if (error && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = String(error);
      }
    } else {
      errorMessage = 'An unknown error occurred during file processing';
    }
    
    // Log detailed error information for debugging
    console.error("Final error during file processing:", {
      message: errorMessage,
      details: errorDetails,
      originalError: error
    });
    
    // Set user-facing error message
    setError(errorMessage);
    
    // Show relevant toast message based on error type
    if (errorMessage.includes('file size') || errorMessage.includes('5MB')) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a smaller PDF file (under 5MB).',
        variant: 'destructive',
      });
    } else if (errorMessage.includes('file type') || errorMessage.includes('PDF')) {
      toast({
        title: 'Invalid File Type',
        description: 'Only PDF files are supported for text extraction.',
        variant: 'destructive',
      });
    } else if (errorMessage.includes('empty') || errorMessage.includes('0 bytes')) {
      toast({
        title: 'Empty File',
        description: 'The uploaded file appears to be empty. Please upload a valid PDF.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Extraction Failed',
        description: 'Could not extract text from the PDF. Please try another file or contact support.',
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
            
            <div className="border-2 border-dashed rounded-md border-gray-200 p-4 bg-gray-50 flex flex-col items-center justify-center">
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
                  className="text-center py-4 w-full"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add('bg-gray-100');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('bg-gray-100');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('bg-gray-100');
                    
                    const droppedFiles = e.dataTransfer.files;
                    if (droppedFiles?.length) {
                      // Simulate the file input change
                      const event = {
                        target: {
                          files: droppedFiles
                        }
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleFileChange(event);
                    }
                  }}
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