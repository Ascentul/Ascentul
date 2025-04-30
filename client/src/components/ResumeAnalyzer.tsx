import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ResumeAnalyzerProps {
  onExtractComplete: (text: string) => void;
  onAnalyzeComplete?: (results: any) => void;
}

const ResumeAnalyzer: React.FC<ResumeAnalyzerProps> = ({
  onExtractComplete,
  onAnalyzeComplete,
}) => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [textareaPlaceholder, setTextareaPlaceholder] = useState<string>(
    'After uploading your resume, extracted text will appear here. You can also paste resume text directly.'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
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
      description: 'Failed to extract text. Please try manually pasting your resume text.',
      variant: 'destructive',
    });
    
    // If extraction fails, suggest manual text entry
    setTextareaPlaceholder('Extraction failed. Please paste your resume text here manually.');
    setActiveTab('paste');
  };

  const handleManualTextUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResumeText(e.target.value);
  };

  const handleContinue = () => {
    if (!resumeText.trim()) {
      setError('Please enter some resume text before continuing.');
      return;
    }
    
    // Call the completion handler with the text
    onExtractComplete(resumeText);
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload size={16} />
              <span>Upload Resume</span>
            </TabsTrigger>
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileText size={16} />
              <span>Paste Text</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4 mt-4">
            <form ref={formRef} className="flex flex-col items-center p-6 border-2 border-dashed rounded-md border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
                name="file"
              />
              <Button 
                type="button"
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
                disabled={uploading || extracting}
              >
                Select PDF File
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file ? file.name : 'PDF files only, up to 5MB'}
              </p>
              {file && (
                <div className="mt-2 flex gap-2">
                  <Button 
                    type="button"
                    onClick={processFile}
                    disabled={uploading || extracting}
                    className="flex items-center gap-2"
                  >
                    {(uploading || extracting) && <Loader2 className="h-4 w-4 animate-spin" />}
                    {uploading ? 'Uploading...' : extracting ? 'Extracting...' : 'Extract Text'}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={resetFileInput}
                    disabled={uploading || extracting}
                  >
                    Reset
                  </Button>
                </div>
              )}
            </form>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="paste" className="space-y-4 mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Paste your resume text below:
            </p>
          </TabsContent>
        </Tabs>
        
        <Alert className="my-4 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700">Two-Step Process</AlertTitle>
          <AlertDescription className="text-blue-700">
            1. Extract text from your resume (this step)
            <br />
            2. In the next step, you'll need to provide a job description to analyze your resume against
          </AlertDescription>
        </Alert>

        <div className="mt-6">
          <Textarea
            value={resumeText}
            onChange={handleManualTextUpdate}
            placeholder={textareaPlaceholder}
            className="h-[300px] font-mono text-sm"
          />
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleContinue}
            disabled={uploading || extracting || !resumeText.trim()}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Continue to Job Description
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzer;