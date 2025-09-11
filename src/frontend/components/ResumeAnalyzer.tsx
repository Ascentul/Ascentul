import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  // Reset file input
  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setError(null);
    setHasExtractedText(false);
    setResumeText('');
  };

  // Process errors from file handling
  const handleProcessError = (error: unknown) => {
    setUploading(false);
    setExtracting(false);
    
    const err = error instanceof Error ? error : new Error('Unknown error');
    let errorMessage = err.message || 'An error occurred during file processing';
    let errorCategory = 'unknown';
    
    console.error('Process error details:', err);
    
    // Categorize common errors
    if (errorMessage.includes('size') || errorMessage.includes('5MB')) {
      errorCategory = 'file_size';
    } else if (errorMessage.includes('Only PDF files') || errorMessage.includes('file type')) {
      errorCategory = 'file_type';
    } else if (errorMessage.includes('empty') || errorMessage.includes('no text')) {
      errorCategory = 'file_empty';
    } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      errorCategory = 'network';
    } else if (errorMessage.includes('parse') || errorMessage.includes('read')) {
      errorCategory = 'parsing';
    } else if (errorMessage.includes('extract') || errorMessage.includes('text')) {
      errorCategory = 'extraction';
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      errorCategory = 'authentication';
    } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
      errorCategory = 'server';
    }
    
    // Set a human-readable error message
    setError(getHumanReadableError(errorMessage, errorCategory));
    
    // Show toast with appropriate message
    switch (errorCategory) {
      case 'file_size':
      case 'file_type':
      case 'file_empty':
        toast({
          title: 'Invalid File',
          description: getHumanReadableError(errorMessage, errorCategory),
          variant: 'destructive',
        });
        break;
      case 'network':
      case 'parsing':
        toast({
          title: 'Processing Error',
          description: getHumanReadableError(errorMessage, errorCategory),
          variant: 'destructive',
        });
        break;
      case 'authentication':
        toast({
          title: 'Authentication Error',
          description: 'Please refresh the page and try again.',
          variant: 'destructive',
        });
        break;
      case 'server':
        toast({
          title: 'Server Error',
          description: 'Our system encountered an issue. Please try again later.',
          variant: 'destructive',
        });
        break;
      case 'extraction':
        toast({
          title: 'Extraction Failed',
          description: 'Could not extract text from the PDF. Please try another file or contact support.',
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

  // Handle successful extraction
  const handleExtractSuccess = (text: string) => {
    // Update state
    setResumeText(text);
    setHasExtractedText(true);
    setUploading(false);
    setExtracting(false);
    
    // Trigger callback
    onExtractComplete(text);
    
    // Show success message
    toast({
      title: 'Success',
      description: 'Resume text extracted successfully',
      variant: 'default',
    });
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
      setExtracting(true);
      setError(null);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Add debugging data
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());

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

      handleExtractSuccess(result.text);
      
    } catch (error) {
      console.error("PDF extraction error:", error);
      handleProcessError(error);
    } finally {
      setUploading(false);
      setExtracting(false);
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

  // Handle file change from input
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
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileDropRef.current) {
      fileDropRef.current.classList.remove('bg-gray-100', 'border-primary');
    }
    
    try {
      const droppedFiles = e.dataTransfer.files;

      if (droppedFiles?.length) {
        // Validate file type before handling
        const droppedFile = droppedFiles[0];
        const fileType = droppedFile.type.toLowerCase();
        const fileName = droppedFile.name.toLowerCase();

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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Analyzing Resume...</span>
                      </>
                    ) : (
                      <>
                        {hasExtractedText ? (
                          <>
                            <BarChart4 className="mr-2 h-4 w-4" />
                            <span>{getButtonText()}</span>
                            {resumeText && jobDescription && (
                              <Sparkles className="ml-2 h-3 w-3 opacity-70" />
                            )}
                          </>
                        ) : (
                          <>
                            <FileUp className="mr-2 h-4 w-4" />
                            <span>{getButtonText()}</span>
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center" className="max-w-sm text-center p-3">
                <p>AI will compare your resume against the job description to identify strengths, gaps, and suggestions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Information Footer */}
          <div className="bg-neutral-50 border border-neutral-100 rounded-md p-3 flex items-start space-x-3">
            <div className="rounded-full bg-blue-50 p-1 mt-0.5">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <p className="font-medium text-neutral-700">Your data is secure</p>
              <p>Resume text is only used for this analysis and is not stored permanently. We do not share your information with third parties.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzer;