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
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type - only allow PDF for now
    const fileType = selectedFile.type;
    
    if (fileType !== 'application/pdf') {
      setError('Currently, we only support PDF files for reliable text extraction.');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    
    setFile(selectedFile);
    
    // Auto-process when a file is selected
    setTimeout(() => {
      processFile();
    }, 100);
  };

  const processFile = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    try {
      setUploading(true);
      setExtracting(true); // We're doing upload and extract in one step now
      setError(null);

      // Method 1: Use direct extraction endpoint (new approach)
      await extractTextWithDirectEndpoint();
      
    } catch (error) {
      console.error("Main extraction process failed:", error);
      
      // If the new method fails, try the legacy approach
      try {
        console.log("Trying legacy extraction method as fallback");
        await legacyExtractProcess();
      } catch (legacyError) {
        handleProcessError(legacyError);
      }
    }
  };

  // New method: Upload and extract in a single step
  const extractTextWithDirectEndpoint = async () => {
    console.log("Using direct extraction endpoint for file:", file?.name);
    
    const formData = new FormData();
    formData.append('file', file as File);
    
    // Send form data to the extraction endpoint
    const response = await fetch('/api/resumes/extract', {
      method: 'POST',
      body: formData,
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Direct extraction failed:", errorText);
      throw new Error(`Extraction failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.text) {
      throw new Error("Server could not extract text from the file");
    }
    
    handleExtractSuccess(result.text);
  };
  
  // Legacy method: Upload first, then extract
  const legacyExtractProcess = async () => {
    console.log("Using legacy two-step process for file:", file?.name);
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file as File);
    
    // Step 1: Upload the file
    const uploadResponse = await fetch('/api/resumes/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      console.error("Legacy upload error:", errorBody);
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success || !uploadResult.filePath) {
      throw new Error('Invalid upload response from server');
    }
    
    console.log("Legacy upload successful, proceeding to extraction");
    
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
      throw new Error('Text extraction failed');
    }
    
    const extractResult = await extractResponse.json();
    
    if (!extractResult.success || !extractResult.text) {
      throw new Error('Invalid extraction response from server');
    }
    
    handleExtractSuccess(extractResult.text);
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
  
  // Handle errors during the extraction process
  const handleProcessError = (error: unknown) => {
    setUploading(false);
    setExtracting(false);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred during file processing';
    
    console.error("Final error during file processing:", errorMessage);
    setError(errorMessage);
    
    toast({
      title: 'Error',
      description: 'Failed to extract text. Please try again or contact support.',
      variant: 'destructive',
    });
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
    <Card className="overflow-hidden border-slate-200">
      <CardContent className="pt-6">
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
                accept=".pdf"
                name="file"
                id="resumeUpload"
              />
              
              {!file ? (
                <div className="text-center py-4">
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