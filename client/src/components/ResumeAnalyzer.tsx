import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileUp, UploadCloud, AlertCircle, Loader2, BarChart4 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import JobDescriptionInput from '@/components/JobDescriptionInput';

interface ResumeAnalyzerProps {
  onExtractComplete: (text: string) => void;
  onAnalyzeComplete?: (results: any) => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  onExtractComplete,
  onAnalyzeComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
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
    
    toast({
      title: 'Success!',
      description: 'Text extracted successfully from PDF',
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
  };

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-3 text-primary/90 flex items-center">
          <FileUp className="h-5 w-5 mr-2" />
          Upload & Analyze Resume
        </h3>
        <p className="text-neutral-600 mb-5 text-sm leading-relaxed border-l-4 border-primary/20 pl-3 py-1 bg-primary/5 rounded-sm">
          Upload your resume and the job description you want to target. Our AI will analyze how well your resume matches 
          the job requirements and provide tailored improvement suggestions.
        </p>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center">
              <span className="text-primary mr-1">1.</span> Upload Resume <span className="text-red-500 ml-1">*</span>
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
                      <div className="bg-primary/10 p-2 rounded">
                        <FileUp className="h-4 w-4 text-primary" />
                      </div>
                      <span className="ml-2 text-sm truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetFileInput}
                      disabled={uploading || extracting}
                      className="h-8 text-neutral-500"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={processFile}
                    disabled={uploading || extracting}
                    className="w-full"
                    size="sm"
                  >
                    {(uploading || extracting) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {uploading ? 'Uploading...' : 'Extracting Text...'}
                      </>
                    ) : (
                      'Process Resume'
                    )}
                  </Button>
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
          
          {/* The textarea for the resume text is hidden from the user */}
          <input type="hidden" id="extractedResumeText" value={resumeText} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzer;