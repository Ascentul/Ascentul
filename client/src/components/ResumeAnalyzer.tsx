import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type - only allow PDF, DOC, DOCX
    const fileType = selectedFile.type;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(fileType)) {
      setError('Please select a PDF, DOC, or DOCX file.');
      return;
    }
    
    // Check file size (limit to 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }
    
    setFile(selectedFile);
  };

  const uploadAndExtractText = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file using credentials to ensure cookies are sent
      const uploadResponse = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Important! This ensures cookies are sent with the request
      });
      
      if (!uploadResponse.ok) {
        const errorBody = await uploadResponse.text();
        console.error("Upload error response:", errorBody);
        throw new Error('File upload failed. Please try again.');
      }
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success || !uploadResult.filePath) {
        throw new Error('File upload failed. Please try again.');
      }
      
      setUploading(false);
      setExtracting(true);
      
      // Now extract text from the uploaded file
      const extractResponse = await apiRequest('POST', '/api/resumes/extract-text', {
        filePath: uploadResult.filePath
      });
      
      const extractResult = await extractResponse.json();
      
      if (!extractResult.success) {
        throw new Error('Text extraction failed. Please try manually entering your resume text.');
      }
      
      setResumeText(extractResult.text);
      setExtracting(false);
      
      toast({
        title: 'Success!',
        description: 'Text extracted successfully.',
        variant: 'default',
      });
      
      // Call the completion handler
      onExtractComplete(extractResult.text);
      
    } catch (error) {
      setUploading(false);
      setExtracting(false);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // If extraction fails, suggest manual text entry
      setTextareaPlaceholder('Extraction failed. Please paste your resume text here manually.');
    }
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
            <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-md border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx"
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
                disabled={uploading || extracting}
              >
                Select File
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file ? file.name : 'PDF, DOC or DOCX files, up to 5MB'}
              </p>
              {file && (
                <div className="mt-2 flex gap-2">
                  <Button 
                    onClick={uploadAndExtractText}
                    disabled={uploading || extracting}
                    className="flex items-center gap-2"
                  >
                    {(uploading || extracting) && <Loader2 className="h-4 w-4 animate-spin" />}
                    {uploading ? 'Uploading...' : extracting ? 'Extracting...' : 'Extract Text'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resetFileInput}
                    disabled={uploading || extracting}
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>
            
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
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeAnalyzer;